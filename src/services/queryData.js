const { Firestore } = require('@google-cloud/firestore');
const { data } = require('@tensorflow/tfjs-node');

async function queryData() {
    const db = new Firestore();
    const predictionsCollection = db.collection('predictions');

    try {
        const snapshot = await predictionsCollection.get();
        console.log(snapshot.d);
        if (snapshot.empty) {
            throw new Error("No predictions found.");
        }

        // Format the response to avoid nested duplication
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return data;
        });

       
    } catch (error) {
        console.error('Error querying Firestore:', error.message);
        throw error;
    }
}

module.exports = queryData;
