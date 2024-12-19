const tf = require("@tensorflow/tfjs-node");
const InputError = require("../exceptions/InputError");
const queryData = require("../services/queryData");

async function predictClassification(model, image) {
  try {
    const tensor = tf.node
      .decodeJpeg(image)
      .resizeNearestNeighbor([224, 224])
      .expandDims()
      .toFloat();

    const prediction = model.predict(tensor);
    const score = await prediction.data();
    const confidenceScore = Math.max(...score) * 100;

    const label = confidenceScore > 50 ? "Cancer":"Non-Cancer";


    let explanation, suggestion;

    if (label === "Cancer") {
      suggestion = "Segera periksa ke dokter!";
    } else if (label === "Non-Cancer") {
      suggestion = "Penyakit kanker tidak terdeteksi.";
    }

    return { confidenceScore, label, explanation, suggestion };
  } catch (error) {
    throw new InputError(`Terjadi kesalahan input: ${error.message}`);
  }
}

async function getPredictionHistories() {
  try {
    const histories = await queryData();  // Fetch the data from Firestore

    // Map through the histories and format them
    return histories.map((history) => ({
      id: history.id,
      history: {
        result: history.result,
        createdAt: history.createdAt,  // Ensure the createdAt is in ISO format
        suggestion: history.suggestion,
        id: history.id,
      },
    }));
  } catch (error) {
    console.error("Error retrieving prediction histories:", error.message);
    throw error;
  }
}

module.exports = {
  predictClassification,
  getPredictionHistories,
};
