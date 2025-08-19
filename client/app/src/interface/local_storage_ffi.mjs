import data from './data.json' assert { type: 'json' };
const CATEGORY_KEY = "categories";
const QUESTION_KEY = "questions";

export function InitializeLocalStorage(){
  try {
    localStorage.setItem(CATEGORY_KEY, JSON.stringify(data.categories));
    localStorage.setItem(QUESTION_KEY, JSON.stringify(data.questions));
  } catch (e) {
    console.error("Error initialize to Local Storage:", e);
  }
}

    // export function saveToLocalStorage(key, data) {
    // try {
    //     localStorage.setItem(key, JSON.stringify(data));
    // } catch (e) {
    //     console.error("Error saving to Local Storage:", e);
    // }
    // }

    // export function loadFromLocalStorage(key) {
    // try {
    //     const data = localStorage.getItem(key);
    //     return data ? JSON.parse(data) : null;
    // } catch (e) {
    //     console.error("Error loading from Local Storage:", e);
    //     return null;
    // }
    // }

    // export async function initializeAndGetCachedData() {


    // try {
    //     let categories = loadFromLocalStorage(CATEGORY_KEY);
    //     let questions = loadFromLocalStorage(QUESTION_KEY);

    //     if (!categories || !questions) {
    //     console.log("Cache miss: Fetching data from Firestore...");
    //     const categorySnapshot = await getDocs(collection(db, "category"));
    //     categories = categorySnapshot.docs.map((doc) => ({
    //         ...doc.data(),
    //         id: doc.id,
    //     }));
    //     saveToLocalStorage(CATEGORY_KEY, categories);

    //     const questionSnapshot = await getDocs(collection(db, "question"));
    //     questions = questionSnapshot.docs.map((doc) => ({
    //         ...doc.data(),
    //         id: doc.id,
    //     }));
    //     saveToLocalStorage(QUESTION_KEY, questions);
    //     console.log("Data fetched and cached.");
    //     } else {
    //     console.log("Cache hit: Loading data from Local Storage...");
    //     }

    //     // Return as a plain JavaScript object, Gleam will handle conversion
    //     return new Ok({
    //     categories: new List(categories),
    //     questions: new List(questions),
    //     });
    // } catch (e) {
    //     console.error("Error in initializeAndGetCachedData:", e);
    //     return new Error(e.message || "Unknown error during data initialization");
    // }
    // }
