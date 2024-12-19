const { predictClassification, getPredictionHistories } = require("../services/inferenceService");
const storeData = require("../services/storeData");
const crypto = require("crypto");

async function postPredictHandler(request, h) {
  try {
    const MAX_IMAGE_SIZE = 1000000; // 1 MB
    const { image } = request.payload;

    // Validate that an image is provided
    if (!image || !image._data) {
      throw Boom.badRequest("Image file is required.");
    }

    // Validate the image size
    const imageSize = image._data.length;
    if (imageSize > MAX_IMAGE_SIZE) {
      return h
        .response({
          status: "fail",
          message:
            "Payload content length greater than maximum allowed: 1000000",
        })
        .code(413);
    }

    // Access the model from the server's app context
    const { model } = request.server.app;

    // Perform prediction logic
    const { confidenceScore, label, suggestion } = await predictClassification(
      model,
      image._data
    );
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const data = {
      id,
      result: label,
      suggestion,
      createdAt,
    };
    // Correct placement of Firestore save
    try {
      await storeData(id, data); // Save to Firestore
    } catch (error) {
      console.error("Error storing data in Firestore:", error);
      throw Boom.internal("Failed to store prediction result.");
    }

    // Generate success response
    const response = h.response({
      status: "success",
      message:
        confidenceScore > 99
          ? "Model is predicted successfully."
          : "Model is predicted successfully but under threshold. Please use the correct picture",
      data,
    });

    response.code(201);
    return response;
  } catch (error) {
    // Handle any error that occurs
    const message = error.isBoom
      ? error.message
      : "Terjadi kesalahan dalam melakukan prediksi";
    return h
      .response({
        status: "fail",
        message,
      })
      .code(400);
  }
}



const getPredictionHistoriesHandler = async (request, h) => {
  try {
    // Fetch prediction histories
    const histories = await getPredictionHistories();

    // Format the response to match the required structure
    const responseHistories = histories.map((history) => ({
      id: history.id, // Top-level ID
      history: {
        result: history.history.result,  // Prediction result
        createdAt: history.history.createdAt,  // Ensure it's ISO string
        suggestion: history.history.suggestion,  // Suggestion based on prediction result
        id: history.id,  // Same `id` for history
      },
    }));

    // Return the response with status code 200
    return h.response({
      status: 'success',
      data: responseHistories,
    }).code(200);  // Set status code to 200 (OK)
  } catch (error) {
    // Error handling for any issues during fetching or processing
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Failed to fetch prediction histories.';
    console.error(message); // Optionally log the error message for better debugging
    return h.response({
      status: 'error',
      message,
    }).code(statusCode);
  }
};

module.exports = {
  postPredictHandler,
  getPredictionHistoriesHandler
};
