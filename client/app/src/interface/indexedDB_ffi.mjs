// import "fake-indexeddb/auto";
import default_data from './data.mjs'
import extra_data from './extra_data.mjs';
import { Ok, Error } from "../gleam.mjs";

const CATEGORY_STORE = "categories";
const QUESTION_STORE = "questions";
const HISTORY_STORE = "history";


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
  {
    storeName: HISTORY_STORE,
    keyPath: { keyPath: "id" },
  }
];

export function setupDefaultDB(dbName, version) {
  return setup(dbName, version, default_data);
}
export function setupExtraDB(dbName, version) {
  return setup(dbName, version, extra_data);
}

/**
 * IndexedDBデータベースを初期化し、接続を確立します。
 * @param {string} dbName データベース名。
 * @param {number} version データベースのバージョン。
 * @returns {Promise<IDBDatabase>} 成功時にはデータベース接続オブジェクト、失敗時にはエラーでrejectされるPromise。
*/
function setup(dbName, version, data) {
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
      transaction.onerror = (e) => {
        console.log("setup Error", event.target.error);
        reject(db);
      };
      transaction.oncomplete = (_) => {
        console.log("Quiz history saved successfully");
        resolve(db);
      }

      if (data.categories) {
        const categoryStore = transaction.objectStore(CATEGORY_STORE);
        data.categories.forEach(category => {
          // console.log("category:", category);
          categoryStore.add(category);
        });
      }

      if (data.questions) {
        const questionStore = transaction.objectStore(QUESTION_STORE);
        data.questions.forEach(question => {
          questionStore.add(question);
        });

        //questionsからhistoryを初期化
        const historyStore = transaction.objectStore(HISTORY_STORE);
        data.questions.forEach(q => {
          historyStore.add({
            id: q.id,
            category: q.category,
            answer: ["NotAnswered"]
          })
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
 * 'questions'ストアからすべての問題のIDとカテゴリのリストを取得します。
 * @param {IDBDatabase} db データベース接続オブジェクト。
 * @returns {Promise<Array<{id: number, category: any}>>} IDとカテゴリのオブジェクトの配列で解決されるPromise。
 */
export function getQuestionIdAndCategoryList(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUESTION_STORE], 'readonly');
    const store = transaction.objectStore(QUESTION_STORE);
    const request = store.getAll(); // すべてのオブジェクトを取得

    request.onerror = (event) => {
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const questions = event.target.result;
      const idAndCategoryList = questions.map(q => ({
        id: q.id,
        category: q.category // categoryオブジェクト全体を渡す
      }));
      resolve(idAndCategoryList);
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
      // console.log("ids:", ids);
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

/**
 * 'quiz_results'ストアにクイズ履歴を保存します。
 * @param {IDBDatabase} db データベース接続オブジェクト。
 * @param {any} result 保存するクイズ履歴オブジェクト。
 * @returns {Promise<IDBValidKey>} 保存されたアイテムのキーで解決されるPromise。
 */
export function saveQuizHistory(db, results) {
  // console.log("result:", results);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([HISTORY_STORE], 'readwrite');
    transaction.onerror = (event) => {
      console.log("Error saving quiz history:", event.target.error);
      reject(new Error(null));
    };
    transaction.oncomplete = (event) => {
      console.log("Quiz history saved successfully");
      resolve(new Ok(null));
    }
    const store = transaction.objectStore(HISTORY_STORE);
    results.forEach(q => {
      store.put({
        id: q.id,
        category: q.category,
        answer: q.answer
      })

      // request.onerror = (event) => {
      //   console.error("Error saving quiz history:", event.target.error);
      //   reject(new Error(null));
      // };

      // request.onsuccess = (event) => {
      //   console.log("Quiz history saved successfully",event.target.result);
      //   resolve(new Ok(null));
      // };
    });
  });
}

/**
 * 'quiz_results'ストアからすべてのクイズ履歴を取得します。
 * @param {IDBDatabase} db データベース接続オブジェクト。
 * @returns {Promise<Array<any>>} クイズ履歴の配列で解決されるPromise。
 */
export function getQuizHistory(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([HISTORY_STORE], 'readonly');
    const store = transaction.objectStore(HISTORY_STORE);
    const request = store.getAll();

    request.onerror = (event) => {
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });
}