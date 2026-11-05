import { Schema, model, type Types } from 'mongoose';

export interface UserDoc {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  workspaceId: Types.ObjectId;
  /** DeepSeek key, AES-256-GCM encrypted (M8). Never returned to clients. */
  aiApiKeyEncrypted: string | null;
  aiKeyIv: string | null;
  aiKeyAuthTag: string | null;
  aiEnabled: boolean;
  /** First-run tour (NIWA-PLAN-B-01 B7); null until finished or skipped. */
  onboarding: { status: 'completed' | 'skipped'; version: number; at: Date } | null;
  /** Appearance (NIWA-PLAN-B-02 V10); null until first changed — the serializer fills the defaults. */
  preferences: {
    theme?: string;
    font?: string;
    mode?: 'system' | 'light' | 'dark';
    /** Public holidays in the Calendar (B-01 B8). */
    holidays?: { country?: string | null; region?: string | null; observances?: boolean };
  } | null;
  /** Set by the operator (scripts/admin.ts) to block sign-in; never shown to other users. */
  disabledAt: Date | null;
  disabledReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    workspaceId: { type: Schema.Types.ObjectId, required: true, ref: 'Workspace' },
    aiApiKeyEncrypted: { type: String, default: null },
    aiKeyIv: { type: String, default: null },
    aiKeyAuthTag: { type: String, default: null },
    aiEnabled: { type: Boolean, default: false },
    onboarding: {
      type: new Schema(
        {
          status: { type: String, enum: ['completed', 'skipped'], required: true },
          version: { type: Number, required: true },
          at: { type: Date, required: true },
        },
        { _id: false },
      ),
      default: null,
    },
    preferences: {
      type: new Schema(
        {
          theme: { type: String },
          font: { type: String },
          mode: { type: String, enum: ['system', 'light', 'dark'] },
          holidays: {
            type: new Schema(
              {
                country: { type: String, default: null },
                region: { type: String, default: null },
                observances: { type: Boolean, default: false },
              },
              { _id: false },
            ),
          },
        },
        { _id: false },
      ),
      default: null,
    },
    disabledAt: { type: Date, default: null },
    disabledReason: { type: String, default: null },
  },
  { timestamps: true, versionKey: false },
);

export const UserModel = model<UserDoc>('User', userSchema, 'users');
