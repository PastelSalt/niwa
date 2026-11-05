import { Navigate, useLocation, useParams } from 'react-router';
import { FocusView } from './actionable/FocusView.tsx';
import { KnowledgeHome } from './knowledge/KnowledgeHome.tsx';
import { LENS_PATH } from './items/itemMeta.tsx';
import { ItemView } from './items/ItemView.tsx';
import { useItem } from './items/queries.ts';

/** Lens pages: an item view when `:itemId` is present, otherwise the lens home. */

export function KnowledgePage() {
  const { itemId } = useParams();
  if (itemId) return <ItemView key={itemId} id={itemId} />;
  return <KnowledgeHome filter="knowledge" />;
}

/** Garden › All (B-01 B9): an item, or what was edited last across the whole garden. */
export function GardenPage() {
  const { itemId } = useParams();
  if (itemId) return <ItemView key={itemId} id={itemId} />;
  return <KnowledgeHome filter="all" />;
}

export function ActionablePage() {
  const { itemId } = useParams();
  if (itemId) return <ItemView key={itemId} id={itemId} />;
  return <FocusView />;
}

/** Canonical `/items/:id` — opens the item in the lens matching its nature (CONCEPT.md §1.3). */
export function ItemRedirect() {
  const { id } = useParams();
  const { hash } = useLocation(); // keep #h-<anchor> section targets
  const { data: item, error } = useItem(id);
  if (error) return <Navigate to="/garden" replace />;
  if (!item) return null;
  return <Navigate to={`${LENS_PATH[item.nature]}/${item.id}${hash}`} replace />;
}
