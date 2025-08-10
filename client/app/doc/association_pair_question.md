1. アプリケーションの概要

このアプリケーションは、2つの列に分かれたアイテムを組み合わせて、正しいペアを見つけるクイズゲームです。すべての正しい組み合わせを見つけると、クイズはクリアとなります。
2. データ構造 (type)
Msg

UIからの操作（メッセージ）を定義します。

    SelectLeft(String): 左側の列のアイテムがクリックされたときに送信されます。StringはクリックされたアイテムのIDです。

    SelectRight(String): 右側の列のアイテムがクリックされたときに送信されます。StringはクリックされたアイテムのIDです。

State

各アイテムの視覚的な状態を定義します。

    NotFocus: デフォルトの状態。未選択、または選択が解除された状態です。

    Focus: 現在選択中のアイテムの状態です。

    Red: 不正解の組み合わせを選択したときの状態です。

    Green: 正解の組み合わせを選択したときの状態です。

Item

左右の列に表示される各要素のデータです。

    id: アイテムを一意に識別するID。正解の組み合わせを判定するために使用します。

    label: UIに表示されるテキストです。

    state: 上記のState型で、アイテムの現在の状態を管理します。

Pair

クイズの正解となる組み合わせを定義します。

    id: 正解のペアを一意に識別するID。ItemのIDと一致します。

    left: 左側の列に表示されるテキストです。

    right: 右側の列に表示されるテキストです。

Model

アプリケーション全体の状態を保持する主要なデータ構造です。

    pairs: クイズの正解となる全ペアのリストです。

    left: 左側の列の全アイテムのリストです。

    right: 右側の列の全アイテムのリストです。

    answered: 正解した組み合わせのIDを格納するリストです。

    selected_left_id: 現在選択されている左側アイテムのID（Option型）。未選択の場合はNoneです。

    selected_right_id: 現在選択されている右側アイテムのID（Option型）。未選択の場合はNoneです。

3. 主要ロジック (fn)
update(model: Model, msg: Msg) -> Model

UIからのメッセージMsgを受け取り、現在の状態Modelを更新して新しいModelを返します。この関数がアプリケーションのコアロジックです。

ロジックの動作フロー:

    SelectLeft(id) メッセージが届いた場合:

        右側が既に選択済みか (selected_right_idがSomeか) を確認します。

            YES: 選択された左側のidと、既に選択されている右側のidを比較します。

                id == right_id であれば正解です。両方のアイテムの状態をGreenにし、answeredリストにIDを追加します。selected_left_idとselected_right_idをNoneにリセットします。

                id != right_id であれば不正解です。両方のアイテムの状態をRedにします。selected_left_idとselected_right_idをNoneにリセットします（UI上でRedが一定時間表示された後、NotFocusに戻る処理を別途実装できます）。

            NO: 左側のみが選択された状態です。左側のアイテムの状態をFocusにし、selected_left_idにidを保存します。

    SelectRight(id) メッセージが届いた場合:

        上記のSelectLeftと同様のロジックで、左右を逆にして処理します。

is_quiz_complete(model: Model) -> Bool

クイズがすべて正解したかどうかを判定する関数です。

    model.pairsのリストの長さと、model.answeredのリストの長さが一致するかを比較します。一致すればTrue（クリア）、そうでなければFalseです。

4. 補助関数

    to_json(pairs: List(Pair)): PairのリストをJSON形式に変換します。

    decode_pairs(): JSONからPairのリストをデコードするためのデコーダーです。

    pair_to_model(pairs: List(Pair)): Pairのリストから初期のModelを生成します。

    update_item_state(items: List(Item), target_id: String, state: State) -> List(Item): 指定されたIDのアイテムの状態のみを更新します。

    reset_focus(items: List(Item)) -> List(Item): すべてのアイテムのFocusとRed状態をNotFocusに戻します。