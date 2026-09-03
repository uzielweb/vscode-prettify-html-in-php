<?php
defined('_JEXEC') or die;
?>
<div class="user-dashboard">
<?php if ($user->isGuest()) : ?>
<div class="alert alert-warning">
<p>Você precisa fazer login para acessar o sistema.</p>
<a href="<?= $loginUrl ?>" class="btn btn-primary">Entrar</a>
</div>
<?php elseif ($user->isPending()) : ?>
<div class="alert alert-info">
<p>Sua conta está em análise.</p>
</div>
<?php else : ?>
<div class="welcome-card">
<h2>Bem-vindo, <?= htmlspecialchars($user->name) ?>!</h2>
<ul class="user-roles">
<?php foreach ($user->getRoles() as $role) : ?>
<li class="role-badge">
<span><?= $role->title ?></span>
</li>
<?php endforeach; ?>
</ul>
</div>
<?php endif; ?>
</div>
