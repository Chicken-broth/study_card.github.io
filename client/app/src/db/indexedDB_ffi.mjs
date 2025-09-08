// import "fake-indexeddb/auto";
import default_data from './data.mjs'
import extra_data from './extra_data.mjs';
import { Ok, Error } from "../gleam.mjs";

const DATADEFAULT = "セキュリティ"
const DATAEXTRA = "英語語根"
const dataSet = [DATADEFAULT, DATAEXTRA]
const CATEGORY_STORE = "categories";
const QUESTION_STORE = "questions";
const QUIZ_RESULT_STORE = "quiz_results";

let initialized = false;

async function initializeDb() {
  if (initialized) return;

  if (process.env.NODE_ENV === 'test') {
    await import("fake-indexeddb/auto");
    console.log("fake-indexeddb loaded for testing.");
  }
  initialized = true;
}

export function getDataSetName() {
  return dataSet
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
  {
    storeName: QUIZ_RESULT_STORE,
    keyPath: { keyPath: "id" },
  }
];

// export function setupDefaultDB(dbName, version) {
//   return setup(dbName, version, default_data);
// }
// export function setupExtraDB(dbName, version) {
//   return setup(dbName, version, extra_data);
// }
function loadData(dbName) {
  switch (dbName) {
    case DATAEXTRA:
      return extra_data;
    default:
      return default_data;
  }
}
function addQuizResults(store,xs) {
  xs.forEach(x => {

    store.add({
      id: x.id,
      category: x.category,
      answer: []
    })
  });
}
/**
 * IndexedDBデータベースを初期化し、接続を確立します。
 * @param {string} dbName データベース名。
 * @param {number} version データベースのバージョン。
 * @returns {Promise<IDBDatabase>} 成功時にはデータベース接続オブジェクト、失敗時にはエラーでrejectされるPromise。
*/
export async function setup(prefix, dbName, version) {
  await initializeDb();
  console.log("\nsetup db:", prefix, dbName, version);
  return new Promise((resolve, reject) => {
    const name = prefix + dbName
    const request = indexedDB.open(name, version);
    request.onerror = (event) => {
      console.error("Database error:", event.target.error);
      reject(new Error(event.target.error));
    };
    
    request.onsuccess = (event) => {
      console.log("Database opened successfully");
      resolve(new Ok(event.target.result));
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
        reject(new Error(event.target.error));
      };
      transaction.oncomplete = (_) => {
        console.log("setup complete");
        resolve(new Ok(db));
      }
      
      const data = loadData(dbName);
      if (data.categories) {
        const categoryStore = transaction.objectStore(CATEGORY_STORE);
        data.categories.forEach(category => {
          console.log("category:", category);
          categoryStore.add(category);
        });
      }
      
      if (data.questions) {
        const questionStore = transaction.objectStore(QUESTION_STORE);
        data.questions.forEach(question =>{
          console.log("question:", question);
          questionStore.add(question);
        });

        //questionsからhistoryを初期化
        const resultStore = transaction.objectStore(QUIZ_RESULT_STORE);
        addQuizResults(resultStore, data.questions)
        // data.questions.forEach(q => {
        //   resultStore.add({
        //     id: q.id,
        //     category: q.category,
        //     answer: []
        //   })
        // });
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
export async function getCategories(db) {
  await initializeDb();
  console.log("--getCategories:");
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
export async function getQuestionCount(db) {
  await initializeDb();
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
export async function getQuestionIdList(db) {
  await initializeDb();
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
export async function getQuestionIdAndCategoryList(db) {
  await initializeDb();
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
export async function getQuestionByIds(db, ids) {
  await initializeDb();
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

export async function getQuestionById(db, id) {
  await initializeDb();
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
 * 'quiz_results'ストアからすべてのクイズ履歴を取得します。
 * @param {IDBDatabase} db データベース接続オブジェクト。
 * @returns {Promise<Array<any>>} クイズ履歴の配列で解決されるPromise。
 */
export async function getQuizResults(db) {
  await initializeDb();
  console.log("--getQuizResults:");
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUIZ_RESULT_STORE], 'readonly');
    const store = transaction.objectStore(QUIZ_RESULT_STORE);
    const request = store.getAll();
    request.onerror = (event) => {
      reject(new Error(event.target.error));
    };

    request.onsuccess = (event) => {
      resolve(new Ok(event.target.result));
    };
  });
}
/**
 * 'quiz_results'ストアにクイズ履歴を保存します。
 * @param {IDBDatabase} db データベース接続オブジェクト。
 * @param {any} result 保存するクイズ履歴オブジェクト。
 * @returns {Promise<IDBValidKey>} 保存されたアイテムのキーで解決されるPromise。
 */
export async function saveQuizResults(db, results) {
  await initializeDb();
  console.log("result:", results);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUIZ_RESULT_STORE], 'readwrite');
    transaction.onerror = (event) => {
      console.log("Error saving quiz history:", event.target.error);
      reject(new Error(null));
    };
    transaction.oncomplete = (event) => {
      console.log("Quiz history saved successfully");
      resolve(new Ok(null));
    }
    const store = transaction.objectStore(QUIZ_RESULT_STORE);
    results.forEach(quiz_result => {
      // quiz_result.answerは要素を一つだけ持つ。はず
      const requestUpdate = store.get(quiz_result.id);
      requestUpdate.onerror = (event) => {
        // エラーが発生した場合の処理
        reject(new Error(null));
      };
      requestUpdate.onsuccess = (event) => {
        // 成功 - データを更新しました!
        const base = event.target.result;

        const new_ans = addAnswers(base, quiz_result)
        store.put({
          id: quiz_result.id,
          category: quiz_result.category,
          answer: new_ans,
        })
        resolve(new Ok(null));
      };


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


function addAnswers(base, new_) {
  // 既存の回答履歴を取得。存在しない、または配列でない場合は空配列を使用します。
  const baseAnswers = (base && Array.isArray(base.answer)) ? base.answer : [];

  // 新しい回答を取得。存在しない、または配列でない、または空配列の場合はnullとします。
  const newAnswer = (new_ && Array.isArray(new_.answer) && new_.answer.length > 0) ? new_.answer[0] : null;

  // 新しい回答がなければ、既存の履歴をそのまま返します。
  if (newAnswer === null) {
    return baseAnswers;
  }

  // 新しい回答を履歴の先頭に追加します。
  const combined = [newAnswer, ...baseAnswers];

  // 履歴を最大3件に制限して返します。
  return combined.slice(0, 3);
}

/**
 * 'quiz_results'ストアのすべてのデータを削除します。
 * @param {IDBDatabase} db データベース接続オブジェクト。
 * @returns {Promise<Ok<null>|Error<null>>} 成功時にはOk(null)、失敗時にはError(null)で解決されるPromise。
 */
export async function resetQuizResults(db) {
  await initializeDb();
  console.log("--resetQuizResults:");
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUIZ_RESULT_STORE, QUESTION_STORE], 'readwrite');
    const quizResultStore = transaction.objectStore(QUIZ_RESULT_STORE);
    const questionStore = transaction.objectStore(QUESTION_STORE);
    
    let newResults;

    // 1. QUIZ_RESULT_STORE をクリアする
    quizResultStore.clear();
    
    // 2. QUESTION_STORE からすべての質問を読み込む
    const request = questionStore.getAll();
    
    request.onerror = (event) => {
      // エラーは transaction.onerror で捕捉される
      console.error("Error reading questions for reset:", event.target.error);
    };
    
    request.onsuccess = (event) => {
      // 3. 読み込んだ質問を元に QUIZ_RESULT_STORE を再作成する
      const questions = event.target.result;
      addQuizResults(quizResultStore, questions);

      // 4. 再作成されたデータを取得する
      const getAllRequest = quizResultStore.getAll();
      getAllRequest.onsuccess = (e) => {
        newResults = e.target.result;
      };
    };
    
    transaction.oncomplete = () => {
      console.log("Quiz results reset and re-initialized successfully.");
      resolve(new Ok(newResults));
    };

    transaction.onerror = (event) => {
      console.error("Transaction error on resetQuizResults:", event.target.error);
      reject(new Error(event.target.error));
    };
  });
}
