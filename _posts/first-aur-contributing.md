---
title: 'AURの孤児の救い方'
date: '2022-08-30'
---

Arch ユーザになってから初めてコントリビュートしました！未来の Arch ユーザのために書き留めておきます

# AUR でアカウントを作る

[AUR](aur.archlinux.org) にアクセスしてアカウントを作成します。ここでは自分がメンテしているパッケージや他のユーザからのリクエストを確認することができます。

# AUR アカウントに SSH key を設定する

AUR Repository へのアクセスは SSH を必要とするので新しく鍵を作成し登録しましょう。

```
$ ssh-keygen ~/.ssh/aur
```

```
Host aur.arhlinux.org
    IdentityFile ~/.ssh/aur
    User aur
```

パブリックキーを AUR アカウントに登録します。

# 孤児となったパッケージをクローンする

新しくパッケージを作るとかだと少し違いますが、今回は孤児となったパッケージをクローンしていきます。該当のパッケージを AUR で検索し、クローン URL を確認してローカルにクローンします。

```
$ git clone ssh://aur@aur.archlinux.org/~~~.git
```

# バージョンアップのために PKGBUILD を編集

PKGBUILD が AUR の核の部分です。ここにアップストリームやビルドの際の処理が書かれているので、適切にバージョンアップを図ってください。
また今回は孤児を救ったので、

```
# Maintainer: Dz99 <@gmail.com>
# Contributor: Nick Black <@gmail.com>
```

といった感じでメンテナを自身に変更して、過去のメンテナをコントリビューターに書き直すことが必要でした。

# テストと .SRCINFO の更新

テストを行う際は

```
$ makepkg
$ sudo pacman -U ~~~.pkg.tar.zst
```

PKGBUILD の書き方が正しければ、パッケージを作成できます。またインストールしてみて動作を確認してみましょう。問題なければ

```
$ makepkg --printsrcinfo > .SRCINFO
```

で .SRCINFO を更新しましょう。.SRCINFO もコミット履歴に入っていないとリジェクトされます。

# リポジトリにプッシュ

最後にリモートリポジトリにプッシュして AUR への投稿は完了です。

```
$ git push origin master
```

[savvycan](https://aur.archlinux.org/packages/savvycan) AUR を確認してみましょう。

今回は特に PKGBUILD ガシガシいじることはなかったので、自分で PKGBUILD を書くなどをやっていきたいです！
あとは今回救ったパッケージはきちんとメンテしていきます :-)
