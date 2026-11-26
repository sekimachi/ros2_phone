
// IDを指定してHTML要素を取得する
const $ = id => document.getElementById(id);

// HTML要素を生成し、親要素pに追加する
const add = (p, tag, text = "") => {
  const e = document.createElement(tag);
  e.textContent = text;
  p.append(e);
  return e;
};

// WebSocket、設定情報、選択中の項目、Serviceの識別番号
let ws, config, selected, id = 0;

// 接続状態を画面に表示する
const status = s => $("status").textContent = s;

// 接続済みの場合、データをJSON形式に変換して送信する
const send = d => ws?.readyState === 1 && ws.send(JSON.stringify(d));


// ===== rosbridgeとの通信 =====

function connect() {
  // Webサイトと同じIPアドレスの9090番ポートに接続
  ws = new WebSocket(`ws://${location.hostname}:9090`);
  status("接続中...");

  // 接続成功時の処理
  ws.onopen = () => {
    status("接続成功");

    // 設定されたMessageのPublisherを登録する
    config.messages?.forEach(t => send({
      op:"advertise", topic:t.name, type:t.type
    }));

    // 選択中の操作画面を更新する
    if (selected) show(...selected);
  };

  // 切断時は3秒後に再接続する
  ws.onclose = () => {
    status("切断・再接続待機中");
    if (selected) show(...selected);
    setTimeout(connect, 3000);
  };

  // 通信エラー時の処理
  ws.onerror = () => status("接続エラー");

  // rosbridgeからデータを受信したときの処理
  ws.onmessage = e => {
    const d = JSON.parse(e.data);

    // Serviceの応答を画面に表示する
    if (d.op === "service_response" && $("result"))
      $("result").textContent = JSON.stringify(d.values, null, 2);

    // rosbridgeからのエラーを表示する
    if (d.op === "status" && d.level === "error")
      status(d.msg);
  };
}


// ===== 操作画面の生成 =====

function show(kind, item) {
  // 現在選択している項目を保存する
  selected = [kind, item];

  // 右側の操作画面を初期化する
  const p = $("panel");
  p.replaceChildren();

  // 選択中のボタンの色を変更する
  document.querySelectorAll("nav button").forEach(b =>
    b.classList.toggle("active", b.dataset.name === kind + item.name));

  // Topic名またはService名を表示する
  add(p, "h2", item.name);

  // topics.jsonのfieldsから入力欄を自動生成する
  const inputs = Object.entries(item.fields).map(([k, v]) => {
    const l = add(p, "label", k);
    const i = add(l, "input");

    // データ型によって入力欄の種類を変更する
    // boolean：チェックボックス
    // number ：数値入力欄
    // string ：文字入力欄
    i.type = typeof v === "boolean" ? "checkbox"
           : typeof v === "number" ? "number" : "text";

    // 初期値を設定する
    if (i.type === "checkbox") i.checked = v;
    else i.value = v;

    // 小数の入力を許可する
    if (i.type === "number") i.step = "any";

    return [k, i];
  });

  // 送信ボタンと結果表示欄を生成する
  const b = add(p, "button", kind === "messages" ? "送信" : "呼び出し");
  const r = add(p, "pre");

  b.className = "send";
  r.id = "result";

  // 未接続の場合は送信ボタンを無効化する
  b.disabled = ws?.readyState !== 1;


  // ===== データの送信 =====

  b.onclick = () => {
    // 入力欄の値を取得してオブジェクトにまとめる
    const msg = Object.fromEntries(inputs.map(([k, i]) =>
      [k, i.type === "checkbox" ? i.checked
        : i.type === "number" ? i.valueAsNumber : i.value]));

    // 不正な数値や空欄がある場合は送信しない
    if (Object.values(msg).some(v =>
      typeof v === "number" && !Number.isFinite(v)))
      return alert("数値を正しく入力してください");

    // WebSocketが切断されている場合は送信しない
    if (ws?.readyState !== 1) return;

    // MessageとServiceで送信する命令を切り替える
    // publish：Topicへのデータ送信
    // call_service：Serviceの呼び出し
    send(kind === "messages"
      ? {op:"publish", topic:item.name, msg}
      : {op:"call_service", service:item.name,
         type:item.type, args:msg, id:String(++id)});

    // 対応するスマートフォンを50ms振動させる
    navigator.vibrate?.(50);

    // 送信状態を画面に表示する
    r.textContent = kind === "messages" ? "送信しました" : "応答待機中...";
  };
}


// ===== 初期化処理 =====

// topics.jsonをWebサーバーから読み込む
fetch("topics.json").then(r => r.json()).then(data => {
  config = data;

  // MessageとServiceの一覧を生成する
  for (const [kind, title] of Object.entries({
    messages:"MESSAGE", services:"SERVICE"
  })) {
    // 左側に分類名を表示する
    add($("menu"), "h3", title);

    // 各Topic・Serviceの選択ボタンを生成する
    (config[kind] || []).forEach(item => {
      const b = add($("menu"), "button", item.name);
      b.dataset.name = kind + item.name;

      // ボタンを押すと右側に操作画面を表示する
      b.onclick = () => show(kind, item);
    });
  }

  // rosbridgeへの接続を開始する
  connect();

  // 最初のMessageまたはServiceを自動選択する
  const kind = ["messages","services"].find(k => config[k]?.length);
  if (kind) show(kind, config[kind][0]);

// 設定ファイルの読み込みに失敗した場合
}).catch(e => status("設定エラー: " + e.message));
