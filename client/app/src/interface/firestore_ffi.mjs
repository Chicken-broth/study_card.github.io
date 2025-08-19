import { initializeApp } from "firebase/app";
import {
  getFirestore,
  getCountFromServer,
  connectFirestoreEmulator,
  collection,
  addDoc,
  getDocs,
  setDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { Ok, Error } from "./gleam.mjs";
import data from './data.json' assert { type: 'json' };
const CATEGORY_STORE = "categories";
const QUESTION_STORE = "questions";

// Firebaseプロジェクト設定
const firebaseConfig = {
  apiKey: "AIzaSyA6QnYLnYMMLfKB_JBcJb8OrMb3KplEmpY",
  authDomain: "studyapp-9dcc6.firebaseapp.com",
  databaseURL: "https://studyapp-9dcc6-default-rtdb.firebaseio.com",
  projectId: "studyapp-9dcc6",
  storageBucket: "studyapp-9dcc6.firebasestorage.app",
  messagingSenderId: "116129945561",
  appId: "1:116129945561:web:c21a0440f87618734d2bc8"
};

/**
 * Firestoreのセットアップと初期データの投入（必要な場合）
 * @returns {Promise<Ok<null>|Error<string>>}
*/
export async function setup(hostname) {
  try {
    const app = initializeApp(firebaseConfig);
    // Cloud Firestoreのインスタンスを取得
    const db = getFirestore(app);
    
    // エミュレータに接続 window.location.hostname === "localhost"
    if (hostname === "localhost") {
      console.log("Connecting to Firestore emulator on localhost:8080");
      connectFirestoreEmulator(db, "localhost", 8080);
    }
    // カテゴリコレクションが空かどうかを確認
    const categoriesSnapshot = await getDocs(collection(db, CATEGORY_STORE));
    if (categoriesSnapshot.empty && data.categories) {
      console.log("Firestoreの'categories'コレクションに初期データを投入します。");
      // data.jsonからカテゴリを投入
      for (const category of data.categories) {
        // ドキュメントIDを明示的に指定してデータを設定
        await setDoc(doc(db, CATEGORY_STORE, category.id), category);
      }
    }

    // 質問コレクションが空かどうかを確認
    const questionsSnapshot = await getDocs(collection(db,QUESTION_STORE));
    if (questionsSnapshot.empty && data.questions) {
      console.log("Firestoreの'questions'コレクションに初期データを投入します。");
      // data.jsonから質問を投入
      for (const question of data.questions) {
         // ドキュメントIDを明示的に指定してデータを設定
        await setDoc(doc(db,QUESTION_STORE, question.id), question);
      }
    }

    console.log("Firestoreのセットアップチェックが完了しました。");
    return new Ok(db); // dbインスタンスを返す
  } catch (e) {
    console.error("Firestoreのセットアップ中にエラーが発生しました:", e);
    return new Error(e.message || "セットアップ中に不明なエラーが発生しました");
  }
}


export function logg(arg){
  console.log("\n logg",arg.a)
  const c =  {a:1,b:"2"}
  return c
}

/**
 * 指定されたコレクションからすべてのドキュメントを取得します。
 * @param {import("firebase/firestore").Firestore} db Firestoreのインスタンス。
 * @param {string} path コレクションのパス。
 * @returns {Promise<Ok<Array<any>>|Error<string>>}
 */
export async function getCategories(db, path) {
  try {
    const querySnapshot = await getDocs(collection(db, path));
    const docs = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    console.log("get collection:", docs);
    return new Ok(docs);
  } catch (e) {
    console.error("Error in getCollection:", e);
    return new Error(e.message || "Unknown error fetching collection");
  }
}

/**
 * 指定されたドキュメントIDでドキュメントを設定（上書き）します。
 * @param {import("firebase/firestore").Firestore} db Firestoreのインスタンス。
 * @param {string} path コレクションのパス。
 * @param {string} doc_id ドキュメントID。
 * @param {object} json 設定するドキュメントのデータ。
 */
export async function setDocument(db, path, doc_id, json) {
  await setDoc(doc(db, path, doc_id), json);
}

/**
 * 'questions'コレクションのドキュメント数を取得します。
 * @param {import("firebase/firestore").Firestore} db Firestoreのインスタンス。
 * @returns {Promise<Ok<number>|Error<string>>}
 */
export async function getQuestionCount(db) {
  try {
    const coll = collection(db,QUESTION_STORE);
    const snapshot = await getCountFromServer(coll);
    return snapshot.data().count
  } catch (e) {
    console.error("Error in getQuestionCount:", e);
    return new Error(e.message || "Unknown error counting questions");
  }
}

/**
 * 'questions'コレクションからIDで特定の質問を取得します。
 * @param {import("firebase/firestore").Firestore} db Firestoreのインスタンス。
 * @param {string} id 取得する質問のドキュメントID。
 * @returns {Promise<Ok<any>|Error<string>>}
 */
export async function getQuestionById(db, id) {
  try {
    const docRef = doc(db,QUESTION_STORE, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const questionData = { ...docSnap.data(), id: docSnap.id };
      return new Ok(questionData);
    }
    else {
      console.log(`No such document with id: ${id}`);
      return new Error("No such document!");
    }
  } catch (e) {
    console.error("Error in getQuestionById:", e);
    return new Error(e.message || "Unknown error fetching question by ID");
  }
}