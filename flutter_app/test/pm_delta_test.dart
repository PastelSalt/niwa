import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:collection/collection.dart';
import 'package:dart_quill_delta/dart_quill_delta.dart';
import 'package:flutter_quill/flutter_quill.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:niwa/features/knowledge/domain/pm_delta.dart';

/// Fixtures come from the web editor's schema
/// (`web_app/src/features/knowledge/editor/editorFixtures.test.ts`).
Json fixture(String name) =>
    jsonDecode(File('test/fixtures/editor/$name.json').readAsStringSync())
        as Json;

const _eq = DeepCollectionEquality();

/// PM → Delta → flutter_quill Document → Delta → PM.
Json throughQuill(Json doc) {
  final document = Document.fromDelta(pmToDelta(doc));
  return deltaToPm(document.toDelta(), original: doc);
}

void main() {
  final supported = [
    'empty',
    'headings',
    'marks',
    'breaks',
    'lists',
    'blocks',
    'embeds',
  ];
  final locked = [
    'locked_multiParagraphListItem',
    'locked_quoteWithList',
    'locked_codeWithLanguage',
    'locked_orderedFromThree',
  ];

  group('supported content round-trips identically', () {
    for (final name in supported) {
      test(name, () {
        final doc = fixture(name);
        final back = deltaToPm(pmToDelta(doc), original: doc);
        expect(_eq.equals(back, doc), isTrue, reason: jsonEncode(back));
        expect(jsonEncode(throughQuill(doc)), jsonEncode(doc));
        expect(
          pmToDelta(doc).toJson().toString(),
          isNot(contains(NiwaEmbed.locked)),
          reason: 'nothing locked',
        );
      });
    }
  });

  group('unsupported content is locked and byte-identical', () {
    for (final name in locked) {
      test(name, () {
        final doc = fixture(name);
        final delta = pmToDelta(doc);
        final lockedOps = delta.operations.where(
          (o) =>
              o.data is Map && (o.data! as Map).containsKey(NiwaEmbed.locked),
        );
        expect(lockedOps, hasLength(1));
        expect(jsonEncode(throughQuill(doc)), jsonEncode(doc));
      });
    }

    test('unknown node types from a newer web editor', () {
      final doc = {
        'type': 'doc',
        'content': [
          {
            'type': 'table',
            'content': [
              {
                'type': 'tableRow',
                'content': [
                  {
                    'type': 'tableCell',
                    'attrs': {'colspan': 1},
                    'content': [
                      {
                        'type': 'paragraph',
                        'content': [
                          {'type': 'text', 'text': 'cell'},
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            'type': 'paragraph',
            'content': [
              {
                'type': 'text',
                'marks': [
                  {
                    'type': 'highlight',
                    'attrs': {'color': '#ff0'},
                  },
                ],
                'text': 'unknown mark locks its paragraph',
              },
            ],
          },
        ],
      };
      expect(jsonEncode(throughQuill(doc)), jsonEncode(doc));
    });

    test('adjacent blocks of the same kind stay separate', () {
      Json list(String t) => {
        'type': 'bulletList',
        'content': [
          {
            'type': 'listItem',
            'content': [
              {
                'type': 'paragraph',
                'content': [
                  {'type': 'text', 'text': t},
                ],
              },
            ],
          },
        ],
      };
      Json code(String t) => {
        'type': 'codeBlock',
        'attrs': {'language': null},
        'content': [
          {'type': 'text', 'text': t},
        ],
      };
      final doc = {
        'type': 'doc',
        'content': [list('a'), list('b'), code('x'), code('y')],
      };
      expect(jsonEncode(throughQuill(doc)), jsonEncode(doc));
    });

    test('a non-default link locks its paragraph', () {
      final doc = fixture('marks');
      final para = (doc['content'] as List).first as Json;
      final link =
          ((para['content'] as List)[11] as Json)['marks'] as List<Object?>;
      ((link.first! as Json)['attrs'] as Json)['target'] = '_self';
      expect(pmToDelta(doc).toJson().toString(), contains(NiwaEmbed.locked));
      expect(jsonEncode(throughQuill(doc)), jsonEncode(doc));
    });
  });

  group('editing in Quill', () {
    test('typed text and formatting come back as ProseMirror', () {
      final doc = fixture('headings');
      final document = Document.fromDelta(pmToDelta(doc))
        // After "Body" (anchor embeds count as one character each).
        ..insert(quillLength(doc) - 1, ' more')
        ..format(0, 0, Attribute.h1);
      final out = deltaToPm(document.toDelta(), original: doc);
      final last = (out['content'] as List).last as Json;
      expect(((last['content'] as List).single as Json)['text'], 'Body more');
    });

    test('editing next to a locked block leaves it untouched', () {
      final doc = fixture('locked_quoteWithList');
      final document = Document.fromDelta(pmToDelta(doc));
      final length = document.length;
      document.insert(length - 1, '!');
      final out = deltaToPm(document.toDelta(), original: doc);
      final content = out['content'] as List;
      expect(
        jsonEncode(content.first),
        jsonEncode((doc['content'] as List).first),
      );
      expect(((content.last as Json)['content'] as List).single, {
        'type': 'text',
        'text': 'x!',
      });
    });
  });

  group('anchors', () {
    Json heading(String text, String? anchor, {int level = 2}) => {
      'type': 'heading',
      'attrs': {'level': level, 'anchorId': anchor},
      'content': [
        {'type': 'text', 'text': text},
      ],
    };
    Json doc(List<Json> blocks) => {'type': 'doc', 'content': blocks};
    List<Object?> anchors(Json d) => [
      for (final b in d['content'] as List)
        if ((b as Json)['type'] == 'heading') (b['attrs'] as Json)['anchorId'],
    ];

    test('a new heading gets an anchor', () {
      final out = deltaToPm(
        Delta()
          ..insert('Fresh')
          ..insert('\n', {'header': 2}),
        random: Random(1),
      );
      expect(anchors(out).single, matches(RegExp(r'^[a-z0-9]{8}$')));
    });

    test('a copied heading gets a fresh anchor; the first keeps its own', () {
      final original = doc([heading('Intro', 'keep1234')]);
      final delta = pmToDelta(doc([heading('Intro', 'keep1234')]));
      // Paste the same heading again (anchor embed included).
      final twice = Delta();
      [...delta.operations, ...delta.operations].forEach(twice.push);
      final ids = anchors(deltaToPm(twice, original: original));
      expect(ids.first, 'keep1234');
      expect(ids.last, isNot('keep1234'));
    });

    test('an anchor deleted by accident is restored by heading text', () {
      final original = doc([heading('Methods', 'methods1')]);
      final edited = Delta()
        ..insert('Methods') // anchor embed backspaced away
        ..insert('\n', {'header': 2});
      expect(anchors(deltaToPm(edited, original: original)), ['methods1']);
    });

    test('a retitled heading keeps its anchor embed', () {
      final original = doc([heading('Old', 'stable01')]);
      final document = Document.fromDelta(pmToDelta(original))
        ..replace(1, 3, 'New title'); // after the anchor embed
      final out = deltaToPm(document.toDelta(), original: original);
      expect(anchors(out), ['stable01']);
      expect(
        (((out['content'] as List).single as Json)['content'] as List).single,
        {'type': 'text', 'text': 'New title'},
      );
    });
  });

  test('list indents that jump levels are clamped', () {
    final out = deltaToPm(
      Delta()
        ..insert('a')
        ..insert('\n', {'list': 'bullet'})
        ..insert('c')
        ..insert('\n', {'list': 'bullet', 'indent': 2}),
    );
    final list = (out['content'] as List).single as Json;
    final first = (list['content'] as List).first as Json;
    expect((first['content'] as List)[1], containsPair('type', 'bulletList'));
  });
}

/// Characters in the Quill document for [doc] (anchor embeds count as one).
int quillLength(Json doc) => Document.fromDelta(pmToDelta(doc)).length;
