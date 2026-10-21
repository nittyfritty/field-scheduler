import { Schema, model, Document } from "mongoose";
const fieldSchema = new Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
});
const Field = model("Field", fieldSchema);
export default Field;
//# sourceMappingURL=Fields.js.map