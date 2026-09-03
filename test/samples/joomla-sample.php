<?php
defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\HTML\HTMLHelper;

$app = Factory::getApplication();
$wa  = $this->document->getWebAssetManager();
$wa->useStyle('template.cassiopeia');
$wa->useScript('template.cassiopeia');
?>
<!DOCTYPE html>
<html lang="<?php echo $this->language; ?>" dir="<?php echo $this->direction; ?>">
<head>
<jdoc:include type="metas" />
<jdoc:include type="styles" />
<jdoc:include type="scripts" />
</head>
<body class="site-body">
<header class="header">
<?php if ($this->countModules('topbar')) : ?>
<div class="container-topbar">
<jdoc:include type="modules" name="topbar" style="none" />
</div>
<?php endif; ?>
<div class="container-banner">
<jdoc:include type="modules" name="banner" style="card" />
</div>
</header>
<div class="site-content container">
<jdoc:include type="message" />
<main class="main-body">
<jdoc:include type="component" />
</main>
<?php if ($this->countModules('sidebar-right')) : ?>
<aside class="sidebar">
<jdoc:include type="modules" name="sidebar-right" style="card" />
</aside>
<?php endif; ?>
</div>
<footer class="footer">
<jdoc:include type="modules" name="footer" style="none" />
</footer>
</body>
</html>
