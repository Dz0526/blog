---
title: 'ArchでEclipseを使ってJava Servlet開発する'
date: '2022-05-08'
---

学校で Java Servlet を開発する機会があり、Eclipse 周りで苦戦したので残しておきます。

# AUR で eclipse-jee を入れる

本家サイトでも Eclipse for Java Developers と Eclipse for Enterprise Java and Web Developers の二種類があるように、AUR にも [eclipse-java](https://aur.archlinux.org/packages/eclipse-java/) と [eclipse-jee](https://aur.archlinux.org/packages/eclipse-jee/) の二種類がある。JavaEE は Web 開発用のパッケージが揃っているものことを指すので、間違えないように入れる。

# tomcat を入れる

適当にパッケージを検索して入れる。

# プロジェクト作成時に Target Runtime を Tomcat にしておく（？）

これをしておかないと Servlet で使われるライブラリ等がインポートされずに怒られる。僕はあとからプロジェクト設定で Server Runtime のライブラリを追加することで対応するはめになった。

# Eclipse の JDK と Tomcat の JRE のバージョンを合わせる

Eclipse でコンパイルされたクラスファイルが動く JRE のバージョンは指定されているので、ここを合わせてあげる必要がある。Eclipse の設定から JDK のバージョン選択で Tomcat で使われている JRE に対応するバージョンを選ぶ。既存のプロジェクトに適応させたい場合はプロジェクトの設定から行う。

よき Eclipse Life を :-)
