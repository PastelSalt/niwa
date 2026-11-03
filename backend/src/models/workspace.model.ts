import { Schema, model, type Types } from 'mongoose';

export interface WorkspaceDoc {
  _id: Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new Schema<WorkspaceDoc>(
  { name: { type: String, required: true, trim: true, maxlength: 120 } },
  { timestamps: true, versionKey: false },
);

export const WorkspaceModel = model<WorkspaceDoc>('Workspace', workspaceSchema, 'workspaces');
