---
title: 'SSD増設！単一ディスクデュアルブート環境からの脱却と悲劇'
date: '2022-12-20'
---

この記事は [YounGeek AdventCalender 2022](https://qiita.com/advent-calendar/2022/youngeek) 8 日目です！
ゆるーく Linux 日記を書いていきやす。

# 背景

ノート PC のディスク容量が足りなくなったので、SSD を増設！
今まではより大きなディスクにクローンすることで対応していた。
いつも通りでも良かったが、M.2 のスロットが余っているかつ、単一のディスクでデュアルブートをしていたので、今回は Arch パーティションを新しい SSD に切り出すことにした。

# 工程

[ArchWiki](https://wiki.archlinux.jp/index.php/%E3%83%A1%E3%82%A4%E3%83%B3%E3%83%9A%E3%83%BC%E3%82%B8) 参考

- オリジナル Arch パーティションから新しい SSD へフルコピー
- GRUB のインストール＆設定

ディスクのクローンと違うのはシステム移行の際に使うコマンドが違うところだ。ディスククローンでは`dd`を使い、今回は`rsync`を使用している。

## SSD フォーマット＆ファイルシステム

無難にもとのやつと同じ構成にした

```
# parted /dev/sd*
```

```
(parted) mkpart primary fat32 1MiB 551MiB
```

EFI = fat32, root = ext4

```
# mkfs.ext4 /dev/sd*
```

```
# mkfs.fat -F 32 /dev/sd*
```

## システムファイルクローン

rsync を使う。新しい SSD をパーティションごとにマウントして、

```
# rsync -aAXHv --exclude={"/dev/*","/proc/*","/sys/*","/tmp/*","/run/*","/mnt/*","/media/*","/lost+found"}
```

オプション `--exclude` の内容はコピーされないようになっている。`-aAXH`でハードリンクやシンボリックリンクを保持してコピーすることができる。また`-v`はコピー中のファイルを表示させるようにしている。

## fstab の更新

[arch-install-scripts](https://archlinux.org/packages/extra/any/arch-install-scripts/)をインストールして genfstab を実行

```
# genfstab -U /mnt >> /mnt/etc/fstab
```

## ブートローダーインストール

ブートローダーがインストールされる配下に`vmlinuz-linux`と`initramfs-linux.img`、`initramfs-linux-fallback.img`をオリジナルから新しいストレージにコピーしておく。（`rsync`コピーの際にマウントが適切にできていないとおそらく存在していない）
grub 関連のコマンドを実行する。

```
# grub-install --target=x86_64-efi --efi-directory=/mnt/boot --boot-directory=/mnt/boot --bootloader-id=GRUB
```

```
# grub-mkconfig -o /mnt/boot/grub/grub.cfg
```

# まとめ

ディスクのクローンをやっていた頃は LiveCD 環境から`dd`を実行していたが、移行前環境からフルコピーを行えたのは良かった。今回は単一ディスクでデュアルブートをしているという特殊な環境から増設＋切り出しを実現するためにこのようなことを行ったが、今後も今回の増設手法を使いたい。\*`rsync`は異なるファイルシステム間で真価を発揮するらしい

# 悲劇

ディスクの容量が少なくなって増設を行ったが、増設後に無駄だったことが判明した。実はゴミ箱がディスクを圧迫していたのだ。`rm`コマンドを使っているとゴミ箱の概念は存在しないが、特定のファイルマネージャーや VScode などからファイルを削除すると一度ゴミ箱に送られる。ずっと LinuxDesktop を使ってきて、初めてゴミ箱の存在気づいた。ゴミ箱に VM 関連のイメージなどが 50GB 入っていて泣いた。

ちなみにゴミ箱は`~/.local/share/Trash/files/`にあります。
みなさんは SSD を買う前に何がどこでディスクを圧迫しているか確認しましょう。（なんか当たり前のことを書いてて涙が出てきた）

よき Linux Life を :-)
