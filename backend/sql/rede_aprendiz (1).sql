-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: rede_aprendiz
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `candidaturas`
--

DROP TABLE IF EXISTS `candidaturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `candidaturas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  `vaga_id` int DEFAULT NULL,
  `data` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuario_vaga` (`usuario_id`,`vaga_id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `vaga_id` (`vaga_id`),
  CONSTRAINT `candidaturas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `candidaturas_ibfk_2` FOREIGN KEY (`vaga_id`) REFERENCES `vagas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `candidaturas`
--

LOCK TABLES `candidaturas` WRITE;
/*!40000 ALTER TABLE `candidaturas` DISABLE KEYS */;
INSERT INTO `candidaturas` VALUES (1,1,1,'2026-04-25 17:26:49'),(8,1,4,'2026-10-30 17:57:13');
/*!40000 ALTER TABLE `candidaturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empresas`
--

DROP TABLE IF EXISTS `empresas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empresas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_general_ci NOT NULL,
  `categoria` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `data_cadastro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empresas`
--

LOCK TABLES `empresas` WRITE;
/*!40000 ALTER TABLE `empresas` DISABLE KEYS */;
INSERT INTO `empresas` VALUES (2,'Vale','Programa Jovem Aprendiz para estudantes do ensino médio','atendimento','2026-06-22 01:05:46'),(3,'Alumar','Vagas para suporte e tecnologia','ti','2026-06-22 01:05:46'),(4,'Mateus','Atendimento ao cliente e reposição','atendimento','2026-06-22 01:05:46'),(5,'Google','Desenvolvimento de software e aplicativos','ti','2026-06-22 01:05:46'),(6,'Agência Criativa','Marketing digital e redes sociais','marketing','2026-06-22 01:05:46');
/*!40000 ALTER TABLE `empresas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `perfil`
--

DROP TABLE IF EXISTS `perfil`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `perfil` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  `nome` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `idade` int DEFAULT NULL,
  `turno` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `horario` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `escola` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `serie` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `area_interesse` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `habilidades` text COLLATE utf8mb4_general_ci,
  `sobre_mim` text COLLATE utf8mb4_general_ci,
  `telefone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `cursos_concluidos` int DEFAULT '0',
  `horas_estudo` int DEFAULT '0',
  `foto_perfil` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `perfil_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `perfil`
--

LOCK TABLES `perfil` WRITE;
/*!40000 ALTER TABLE `perfil` DISABLE KEYS */;
INSERT INTO `perfil` VALUES (1,1,'gerson felipe',17,'Manhã','Tarde',NULL,NULL,NULL,NULL,NULL,NULL,0,0,'/uploads/perfis/usuario-1-1793401795966.png'),(11,1,'Gerson',18,'Manhã','Tarde','ifma','2º Ano','TI','x','xx','98988642696',3,4,'/uploads/perfis/usuario-1-1793401795966.png');
/*!40000 ALTER TABLE `perfil` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(80) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `telefone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `senha` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Gerson Felipe Pinheiro Pereira','gersonfelipe@acad.ifma.edu.br','98988642696','12345678');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vagas`
--

DROP TABLE IF EXISTS `vagas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vagas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `empresa` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `turno` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `descricao` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `empresa_id` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vagas`
--

LOCK TABLES `vagas` WRITE;
/*!40000 ALTER TABLE `vagas` DISABLE KEYS */;
INSERT INTO `vagas` VALUES (1,'Atendente (Meio período)','Mateus','Tarde','Compatível com escola',4),(4,'Auxiliar Administrativo','Agência Criativa','Manhã','Organização de documentos',6),(5,'Suporte de TI','Vale','Tarde','Atendimento técnico',2),(6,'Atendente','Alumar','Noite','Atendimento ao cliente',3);
/*!40000 ALTER TABLE `vagas` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-30 20:45:57
