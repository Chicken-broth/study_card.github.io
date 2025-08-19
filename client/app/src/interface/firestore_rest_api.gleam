import gleam/string

// https://firestore.googleapis.com/v1/projects/studyapp-9dcc6/databases/(default)/documents/category
// 上記URLにてcategoryの値を取得できます。かえって来るJSONは以下です。
// {
//   "documents": [
//     {
//       "name": "projects/studyapp-9dcc6/databases/(default)/documents/category/GqS6dABrgaNUtm2aGU1q",
//       "fields": {
//         "name": {
//           "stringValue": "html"
//         }
//       },
//       "createTime": "2025-08-11T08:25:33.293341Z",
//       "updateTime": "2025-08-11T08:25:33.293341Z"
//     },
//     {
//       "name": "projects/studyapp-9dcc6/databases/(default)/documents/category/UuDMCiDEvSd62JRPoi6J",
//       "fields": {
//         "name": {
//           "stringValue": "lustre"
//         }
//       },
//       "createTime": "2025-08-11T08:24:43.044035Z",
//       "updateTime": "2025-08-11T08:24:43.044035Z"
//     }
//   ]
// }
const base_url = "http://localhost:8080"

const project_name = "studyapp-9dcc6"

const document_category = "category"

const document_question = "question"

pub fn category_url() -> String {
  create_document_url(base_url, project_name, document_category)
}

pub fn question_url() {
  create_document_url(base_url, project_name, document_question)
}

fn create_document_url(
  base: String,
  project: String,
  document: String,
) -> String {
  string.join(
    [
      base,
      "v1",
      "projects",
      project,
      "databases",
      "(default)",
      "documents",
      document,
    ],
    "/",
  )
}
