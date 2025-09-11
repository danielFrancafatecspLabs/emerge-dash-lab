import mongoose from "mongoose";

const ExperimentoSchema = new mongoose.Schema({}, { strict: false });
const Experimento = mongoose.model("Experimento", ExperimentoSchema);

export default Experimento;
