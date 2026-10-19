import {Schema, model, Document} from "mongoose";

export interface IField extends Document {
  name: string;
  location: string;
}

const fieldSchema = new Schema<IField>({
  name: { type: String, required: true },
  location: { type: String, required: true },
});

const Field = model<IField>("Field", fieldSchema);

export default Field;