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
  },
  { timestamps: true, versionKey: false },
);

export const UserModel = model<UserDoc>('User', userSchema, 'users');
