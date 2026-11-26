# ros2_phone

スマートフォンのWebブラウザからROS2を操作するためのWebアプリケーションです。

rosbridgeを利用して、スマートフォンとROS2間の通信を行います。専用アプリをインストールする必要がなく、同一ネットワーク内でROS2のトピック送信やサービス呼び出しを行うことを目的としています。

## 主な機能

- スマートフォンからのROS2操作
- トピックのPublish
- サービスの呼び出し
- ROS2との接続状態の表示
- JSONファイルによる操作項目の管理
- コントローラー画面への切り替え
- rosbridgeとWebサーバーの一括起動

## 動作環境

| 項目 | 環境 |
|---|---|
| OS | Windows 11 / WSL2 |
| Linux | Ubuntu 22.04 |
| ROS | ROS2 Humble |
| 通信 | rosbridge / WebSocket |
| Webサーバー | Python 3 |
| 使用言語 | HTML / CSS / JavaScript |
| 操作端末 | スマートフォン・PC |

## システム構成

```text
スマートフォン
  Webブラウザ
      ↕ Wi-Fi
      ↕ WebSocket
PC（Ubuntu / WSL2）
  rosbridge_server
      ↕
     ROS2
      ↕
  各種ROS2ノード
```

Webページの配信にはポート8000、rosbridgeとの通信にはポート9090を使用します。

## ディレクトリ構成

```text
ros2_phone/
├── index.html
├── controller.html
├── main.css
├── main.js
├── topics.json
├── server_rosbridge.sh
└── README.md
```

| ファイル | 内容 |
|---|---|
| index.html | メイン操作画面 |
| controller.html | コントローラー画面 |
| main.css | Webページのデザイン |
| main.js | ROS2との通信・画面制御 |
| topics.json | 操作項目の定義 |
| server_rosbridge.sh | サーバー起動用スクリプト |

## 環境構築

### 1. ROS2のインストール

Ubuntu 22.04にROS2 Humbleをインストールしてください。

公式ドキュメント：

https://docs.ros.org/en/humble/Installation.html

### 2. rosbridgeのインストール

```bash
sudo apt update
sudo apt install ros-humble-rosbridge-suite
```

### 3. リポジトリのクローン

```bash
cd ~
git clone https://github.com/sekimachi/ros2_phone.git
cd ros2_phone
```

### 4. 実行権限の付与

```bash
chmod +x server_rosbridge.sh
```

## WSL2のネットワーク設定

WSL2を利用する場合は、スマートフォンからアクセスできるようにネットワークを設定します。

Windows側のユーザーフォルダにある `.wslconfig` を以下のように設定します。

```ini
[wsl2]
networkingMode=mirrored
dnsTunneling=true
firewall=true
```

設定後、PowerShellでWSLを再起動します。

```powershell
wsl --shutdown
```

また、Windowsファイアウォールで以下のTCPポートへの受信通信を許可してください。

| ポート | 用途 |
|---|---|
| 8000 | Webページの配信 |
| 9090 | rosbridgeとの通信 |

## 起動方法

### 一括起動

Ubuntuのターミナルで以下のコマンドを実行します。

```bash
source /opt/ros/humble/setup.bash
cd ~/ros2_phone
./server_rosbridge.sh
```

rosbridgeとWebサーバーが起動します。

終了する場合は `Ctrl + C` を押してください。

### 個別起動

rosbridgeを起動します。

```bash
source /opt/ros/humble/setup.bash
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

別のターミナルでWebサーバーを起動します。

```bash
cd ~/ros2_phone
python3 -m http.server 8000 --bind 0.0.0.0
```

## スマートフォンからの接続

1. PCとスマートフォンを同じWi-Fiに接続します。
2. PCのIPアドレスを確認します。
3. スマートフォンのブラウザから以下のURLにアクセスします。

```text
http://PCのIPアドレス:8000
```

例えば、PCのIPアドレスが `192.168.1.10` の場合は以下のようになります。

```text
http://192.168.1.10:8000
```

WindowsのIPアドレスはPowerShellで確認できます。

```powershell
ipconfig
```

PC自身から操作する場合は、以下のURLにアクセスします。

```text
http://localhost:8000
```

## 使用方法

1. Webページを開きます。
2. ROS2との接続状態を確認します。
3. 操作したいトピックまたはサービスを選択します。
4. 必要なデータを入力します。
5. 送信ボタンを押します。

## トピックの追加・変更

操作項目は `topics.json` で管理します。

新しいトピックや操作項目を追加する場合は、このファイルを編集してください。

カスタムメッセージを使用する場合は、該当するROS2パッケージをビルドし、rosbridgeを起動する前にワークスペースを読み込んでください。

```bash
source ~/your_ws/install/setup.bash
```

## 動作確認

ROS2のトピック一覧を確認します。

```bash
ros2 topic list
```

トピックの詳細を確認します。

```bash
ros2 topic info /test_bool
```

トピックの受信内容を確認します。

```bash
ros2 topic echo /test_bool
```

スマートフォンからデータを送信し、ターミナルに受信内容が表示されることを確認してください。

## トラブルシューティング

### スマートフォンからアクセスできない

- PCとスマートフォンが同じWi-Fiに接続されているか確認する。
- IPアドレスが正しいか確認する。
- Webサーバーが起動しているか確認する。
- Windowsファイアウォールの設定を確認する。
- WSL2のネットワーク設定を確認する。

### ROS2に接続できない

- rosbridgeが起動しているか確認する。
- ポート9090への通信が許可されているか確認する。
- WebSocketの接続先が正しいか確認する。

### カスタムメッセージを送信できない

- メッセージパッケージがビルドされているか確認する。
- ワークスペースの `setup.bash` を読み込んでいるか確認する。
- メッセージ型やフィールド名が正しいか確認する。

## 今後の開発予定

- 仮想ジョイスティックの実装
- ロボットの手動操作機能
- Actionへの対応
- トピックの購読・受信データの表示
- ロボットの状態表示
- 操作画面の改善

## 注意事項

本アプリケーションは、ロボット開発やロボットコンテストなどでの利用を想定しています。

信頼できるローカルネットワーク内で使用してください。認証や暗号化を行わずにrosbridgeをインターネットへ公開することは避けてください。

実機を操作する際は、通信切断時の自動停止処理や非常停止機能をロボット側に実装してください。

## 参考資料

- [ROS2 Humble Documentation](https://docs.ros.org/en/humble/)
- [rosbridge_suite](https://github.com/RobotWebTools/rosbridge_suite)
- [WSLのネットワークについて](https://learn.microsoft.com/ja-jp/windows/wsl/networking)
