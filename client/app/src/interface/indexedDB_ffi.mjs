// import "fake-indexeddb/auto";
import data from './data.mjs'
// import { Ok, Error,List } from "./gleam.mjs";

const CATEGORY_STORE = "categories";
const QUESTION_STORE = "questions";

export function get_data(){
  return data;
}
/**
 * @typedef {Object} StoreConfig
 * @property {string} storeName オブジェクトストア名。
 * @property {IDBObjectStoreParameters} [keyPath] オブジェクトストアのキーパス（例: { keyPath: "id" }）。
 */

/**
 * データベースのストア設定。
 * @type {Array<StoreConfig>}
 */
const STORE_CONFIGS = [
  {
    storeName: CATEGORY_STORE,
    keyPath: { keyPath: "id" },
  },
  {
    storeName: QUESTION_STORE,
    keyPath: { keyPath: "id" },
  },
];

/**
 * IndexedDBデータベースを初期化し、接続を確立します。
 * @param {string} dbName データベース名。
 * @param {number} version データベースのバージョン。
 * @returns {Promise<IDBDatabase>} 成功時にはデータベース接続オブジェクト、失敗時にはエラーでrejectされるPromise。
 */
export function setup(dbName, version) {
  // console.log("data",data);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);

    request.onerror = (event) => {
      console.error("Database error:", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      console.log("Database opened successfully");
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      console.log("Database upgrade needed");
      const db = event.target.result;

      // オブジェクトストアを作成
      STORE_CONFIGS.forEach(config => {
        if (!db.objectStoreNames.contains(config.storeName)) {
          db.createObjectStore(config.storeName, config.keyPath);
        }
      });

      const transaction = event.target.transaction;

      if (data.categories) {
        const categoryStore = transaction.objectStore(CATEGORY_STORE);
        data.categories.forEach(category => {
          console.log("category:", category);
          categoryStore.add(category);
        });
      }

      if (data.questions) {
        const questionStore = transaction.objectStore(QUESTION_STORE);
        data.questions.forEach(question => {
          questionStore.add(question);
        });
      }

      console.log("Database setup and data seeding complete.");
    };
  });
}

/**
 * 'categories'ストアからすべてのカテゴリを取得します。
 * @param {IDBDatabase} db データベース接続オブジェクト。
 * @returns {Promise<Array<any>>} カテゴリの配列で解決されるPromise。
 */
export function getCategories(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CATEGORY_STORE], 'readonly');
    const store = transaction.objectStore(CATEGORY_STORE);
    const request = store.getAll();

    request.onerror = (event) => {
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });
}

/**
 * 'questions'ストアのレコード数を取得します。
 * @param {IDBDatabase} db データベース接続オブジェクト。
 * @returns {Promise<number>} レコード数で解決されるPromise。
 */
export function getQuestionCount(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUESTION_STORE], 'readonly');
    const store = transaction.objectStore(QUESTION_STORE);
    const request = store.count();
    
    request.onerror = (event) => {
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });
}

/**
 * 'questions'ストアのすべてのキー（ID）を取得します。
 * @param {IDBDatabase} db データベース接続オブジェクト。
 * @returns {Promise<Array<number>>} キーの配列で解決されるPromise。
 */
export function getQuestionIdList(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUESTION_STORE], 'readonly');
    const store = transaction.objectStore(QUESTION_STORE);
    const request = store.getAllKeys();

    request.onerror = (event) => {
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });
}

/**
 * 'questions'ストアからIDで特定のquestionを取得します。
 * @param {IDBDatabase} db データベース接続オブジェクト。
 * @param {number} id 取得するquestionのID。
 * @returns {Promise<any>} questionオブジェクトで解決されるPromise。見つからない場合はundefined。
 */
export function getQuestionByIds(db, ids) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUESTION_STORE], 'readonly');
    const store = transaction.objectStore(QUESTION_STORE);
    //idのlistから、idに対応する結果をlistで返します。
    if (!Array.isArray(ids)) {
      ids = [...ids];
      // console.log("tran:", transaction);
      // console.log("store:", store);
      console.log("ids:", ids);
    }

    const results = [];
    let completedRequests = 0;

    ids.forEach(id => {
      const request = store.get(id);
      // console.log("request:", request);
      request.onerror = (event) => {
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        results.push(event.target.result);
        completedRequests++;
        if (completedRequests === ids.length) {
          // console.log("completedRequests:", [...results]);
          resolve(results);
        }
      };
    });
  });
}

export function getQuestionById(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUESTION_STORE], 'readonly');
    const store = transaction.objectStore(QUESTION_STORE);
    const request = store.get(id);
    // console.log("request:", request);
    request.onerror = (event) => {
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
        resolve(event.target.result);
    };
  });
}