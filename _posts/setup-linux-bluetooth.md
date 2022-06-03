---
title: 'Arch(Dual Boot)でBluetoothのセットアップをする'
date: '2022-06-04'
---

Linux デュアルブート環境で Bluetooth デバイスを使う環境を整えました！少し躓いた部分があったので残しておこうと思います。

# bluez などのパッケージのインストール

バックエンド [bluez](https://www.archlinux.jp/packages/?name=bluez) とコンソールクライアントを追加する [bluez-utils](https://www.archlinux.jp/packages/?name=bluez-utils) をインストール。GUI クライアントはいくつか選択肢があるが、今回は i3 を使っていることもありトレイアプレットが含まれる [blueberry](https://www.archlinux.jp/packages/?name=blueberry) を選択した。bluetooth アダプタのドライバ `btusb` をロードし、`bluetooth.service` を起動、有効化する。

```
$ modprobe btusb
```

```
$ sudo systemctl start bluetooth
$ sudo systemctl enable bluetooth
```

# Bluetooth アダプタを自動で起動。接続

デフォルトでは自動で起動しないので、`/etc/bluetooth/main.conf` に以下を追加

```
[Policy]
AutoEnable=true
```

# デュアルブートに対応させる

これが起こってしまう理由だが、Bluetooth サービスはペアリングの際に、コンピュータには Bluetooth デバイスの MAC アドレスに対応させたペアリングキーを、BLuetooth デバイスにはコンピュータの MAC アドレスに対応させたペアリングキーを保存する。こうすることによって情報を保存している。しかし、コンピュータの MAC アドレスは一意のものなので、それぞれの OS で Bluetooth デバイスをペアリングしようとすると、Bluetooth デバイスに保存されているペアリングキーが上書きされてしまうことになる。したがって片方の OS で生成されたペアリングキーをもう片方の OS で上書き保存すれば、複数の OS で共有することが出来る！

### Windows で生成されたペアリングキーを抜き取る

PsTools をダウンロードして解凍、レジストリエディタを起動する

```
./PsExec64.exe -s -i regedit.exe
```

レジストリエディタで `HKEY_LOCAL_MACHINE` に移動
このもう少し下に各 Bluetooth デバイスの MAC アドレスの書かれたキーが見つかるので、見つかりしだいそれをエクスポートする。テキストエディタでのぞくと `LTK` や `ERand` などが見られるはず。最後にレジスタファイルをテキストに変換したものを Linux 側が簡単に受け取れるように保存。

### Linux にて Windwos で生成されたペアリングキーに情報を修正する

root ユーザに切り替えて `/var/lib/bluetooth/XX:XX:XX...` に移動する。このディレクトリの中には Bluetooth デバイスの MAC アドレスの名前のディレクトリがあるので、対応するディレクトリに入る。Windows と Linux で該当の Bluetooth デバイスの MAC アドレスが一致していない可能性があるので(???)違っていた場合は、Windows に合わせて修正（MAC アドレスはコンピュータやデバイスごとに一意のものだと思っていたので不思議）。
Bluetooth デバイスのディレクトリ内で info というファイルがあるので、ここにあるペアリングキー情報を Windows のものに置き換えていく。デバイスによって違うが、Windows のレジスタファイルで`LTK`と`ERand`、`EDIV`、`IRK` を記載されていたものを Linux の info 内でそれぞれ `LongTermKey.Key`と`Rand`、`EDiv`、`IdentityResolvingKey.Key` に対応させて記述する

```
[LongTermKey]
Key=(convert(LTK))
Rand=(convert(ERand))
EDiv=(convert(EDIV))
...etc
```

最後はリブートで動作確認しておしまいです！よき Linux ライフを :-)
