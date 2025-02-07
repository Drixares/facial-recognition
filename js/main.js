let faceApi;
let storedPhoto;
let video;
let detections = [];
let storedDescriptor;

function setup() {
    // Créer un canvas plus large pour afficher les deux images côte à côte
    createCanvas(1280, 480);
    
    // Configuration de la webcam
    video = createCapture(VIDEO);
    video.size(640, 480);
    video.hide();

    // Charger la photo stockée et redimensionner
    storedPhoto = loadImage('images/matteo.jpg', img => {
        // Redimensionner l'image tout en conservant les proportions
        const scale = Math.min(640 / img.width, 480 / img.height);
        img.resize(img.width * scale, img.height * scale);
    });
    
    // Initialiser FaceAPI
    const detection_options = {
        withLandmarks: true,
        withDescriptors: true,
    };
    
    faceApi = ml5.faceApi(video, detection_options, modelReady);
}

function modelReady() {
    console.log('Modèle Prêt!');
    // Obtenir le descripteur pour la photo stockée
    faceApi.detectSingle(storedPhoto, (err, result) => {
        if (err) {
            console.error(err);
            return;
        }
        if (result) {
            storedDescriptor = result.descriptor;
            // Commencer la détection sur le flux vidéo
            faceApi.detect(gotResults);
        }
    });
}

function gotResults(err, results) {
    if (err) {
        console.error(err);
        return;
    }
    
    detections = results;
    
    // Effacer l'arrière-plan
    background(255);
    
    // Calculer la position pour centrer la photo stockée
    const x = (640 - storedPhoto.width) / 2;
    
    // Afficher la photo stockée à gauche, centrée
    image(storedPhoto, x, 0, storedPhoto.width, storedPhoto.height);
    
    // Afficher la vidéo à droite
    image(video, 640, 0, 640, 480);
    
    if (detections) {
        for (let detection of detections) {
            // Dessiner le cadre de détection sur la vidéo
            const x = detection.alignedRect._box._x + 640; // Ajuster x pour la position de la vidéo
            const y = detection.alignedRect._box._y;
            const boxWidth = detection.alignedRect._box._width;
            const boxHeight = detection.alignedRect._box._height;
            
            noFill();
            stroke(0, 255, 0);
            strokeWeight(2);
            rect(x, y, boxWidth, boxHeight);
            
            // Comparer les visages
            if (storedDescriptor && detection.descriptor) {
                const distance = faceDistance(detection.descriptor, storedDescriptor);
                const confidence = ((1 - distance) * 100).toFixed(2);
                const threshold = 50; // Seuil de 50%
                
                // Afficher le texte de confiance
                textSize(24);
                textAlign(CENTER);
                fill(0);
                text(`Taux de ressemblance: ${confidence}%`, width/2, height - 40);
                
                // Afficher l'emoji approprié
                textSize(48);
                if (confidence >= threshold) {
                    text('✅', width/2, height - 80);
                } else {
                    text('❌', width/2, height - 80);
                }
            }
        }
    }
    
    // Continuer la détection
    faceApi.detect(gotResults);
}

// Fonction pour calculer la distance entre deux descripteurs faciaux
function faceDistance(descriptor1, descriptor2) {
    return euclideanDistance(descriptor1, descriptor2);
}

// Fonction pour calculer la distance euclidienne
function euclideanDistance(arr1, arr2) {
    return Math.sqrt(
        arr1.reduce((sum, val, i) => sum + Math.pow(val - arr2[i], 2), 0)
    );
}

// Supprimer l'appel direct à setup() car p5.js l'appelle automatiquement