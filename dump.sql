-- phpMyAdmin SQL Dump
-- version 3.5.1
-- http://www.phpmyadmin.net
--
-- Хост: 127.0.0.1
-- Время создания: Фев 06 2015 г., 17:30
-- Версия сервера: 5.5.25
-- Версия PHP: 5.3.13


--
-- База данных: `testreg`
--

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nick` varchar(40) NOT NULL,
  `email` varchar(100) NOT NULL DEFAULT '',
  `password` char(37) NOT NULL,
  `registerDate` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `lastvisitDate` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `activation` tinyint(1) DEFAULT '0',
  `avatar` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `email` (`email`(5))
) ENGINE=MyISAM DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
