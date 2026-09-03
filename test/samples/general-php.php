<?php
/**
 * Test General PHP + HTML Formatting
 */
$pageTitle = 'Minha Página PHP';
$items = ['Item 1', 'Item 2', 'Item 3'];
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= $pageTitle ?></title>
<link rel="stylesheet" href="style.css">
</head>
<body class="site-body">
<header class="header">
<div class="container">
<h1><?= $pageTitle ?></h1>
<nav class="nav">
<ul>
<li><a href="/">Início</a></li>
<li><a href="/sobre">Sobre</a></li>
</ul>
</nav>
</div>
</header>
<main class="main-content">
<section class="intro">
<p>Texto introdutório com <strong>destaque</strong> e link <a href="#">aqui</a>.</p>
</section>
</main>
</body>
</html>
