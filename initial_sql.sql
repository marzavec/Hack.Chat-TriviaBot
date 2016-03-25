-- phpMyAdmin SQL Dump
-- version 4.0.10deb1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Mar 25, 2016 at 01:24 PM
-- Server version: 5.5.47-0ubuntu0.14.04.1
-- PHP Version: 5.5.9-1ubuntu4.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `rankbot`
--

-- --------------------------------------------------------

--
-- Table structure for table `points`
--

CREATE TABLE IF NOT EXISTS `points` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bridgeid` int(11) NOT NULL,
  `trip` varchar(7) NOT NULL,
  `nick` varchar(25) NOT NULL,
  `points` int(11) NOT NULL,
  `prof` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=43 ;

--
-- Dumping data for table `points`
--

INSERT INTO `points` (`id`, `bridgeid`, `trip`, `nick`, `points`, `prof`) VALUES
(0, 0, 'cC0D3H', 'Rut', -99824, '[{"cat":"devtest","points":27},{"cat":"rhondonize","points":1},{"cat":"network","points":20}]');

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

CREATE TABLE IF NOT EXISTS `questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `points` int(4) NOT NULL,
  `tta` int(2) NOT NULL,
  `pass` int(11) NOT NULL,
  `fail` int(11) NOT NULL,
  `cat` varchar(12) NOT NULL,
  `question` text NOT NULL,
  `answer` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=64 ;

--
-- Dumping data for table `questions`
--

INSERT INTO `questions` (`id`, `points`, `tta`, `pass`, `fail`, `cat`, `question`, `answer`) VALUES
(1, 2, 20, 2, 0, 'js', 'true or false: 5 === "5"', '["false"]'),
(2, 25, 30, 0, 0, 'js', 'copy, paste & fix the following: for(var i=0; j<10; i++){}', '["for(var i=0; i<10; i++){}","for(var i = 0; i < 10; i++){}","for(var i=0; i<10; i++)","for(var i = 0; i < 10; i++)"]'),
(3, 15, 20, 0, 0, 'misc', 'answer in hex (eg 0x0c or 0x0f), what does this equal: 0xb - 0xe + 0xd?', '["0xa","0xA"]'),
(4, 10, 15, 0, 0, 'java', 'true or false: in Java, all non-static methods are by default "virtual functions"', '["true"]'),
(5, 5, 15, 0, 0, 'misc', 'in most languages, a variable that is only going to be true (1) or false (0) is called what?', '["boolean","bool"]'),
(6, 5, 15, 0, 0, 'php', 'true or false: PHP is client-side only', '["false"]'),
(7, 25, 30, 0, 0, 'php', 'copy, paste & fix the following: echo "Hello"+" "+"World";', '["echo \\"Hello\\".\\" \\".\\"World\\";","echo \\"Hello\\" . \\" \\" . \\"World\\";","echo \\"Hello\\".\\" \\".\\"World\\"","echo \\"Hello\\" . \\" \\" . \\"World\\""]'),
(8, 15, 20, 0, 0, 'js', 'copy, paste & fix this code: Nubmer("5") + 6', '["Number(\\"5\\") + 6","Number(\\"5\\")+6","Number(\\"5\\") + 6;","Number(\\"5\\")+6;"]'),
(9, 10, 15, 0, 0, 'js', 'what does this output: Number("5") + 6', '["11","eleven"]'),
(10, 20, 20, 0, 0, 'js', 'what would you do to push the string "text" to the array ''texty''?', '["texty.push(\\"text\\");","texty.push(\\"text\\")","texty.push(''text'');","texty.push(''text'')","texty[texty.length - 1] = ''text'';","texty[texty.length - 1] = ''text''","texty[texty.length - 1] = \\"text\\";","texty[texty.length - 1] = \\"text\\""]');

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
