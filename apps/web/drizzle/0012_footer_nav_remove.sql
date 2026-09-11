-- Footer nav removed: drop footer menu rows (header + social remain).
DELETE FROM `menus` WHERE `location` = 'footer';
