// Arquivo de configuração (separado para segurança)
require('dotenv').config(); // Usar variáveis de ambiente

module.exports = {
  // Token do bot (armazenado em .env)
  TOKEN: process.env.BOT_TOKEN,
  
  // IDs dos canais e cargos
  VERIFY_CHANNEL_ID: '1373038578203885599',
  STAFF_CHANNEL_ID: '1373043471945957578',
  VERIFIED_ROLE_ID: '1373032899653275759',
  DEFAULT_ROLE_ID: '1373040929128317070',
  NUKE_ROLE_ID: '1367727294600187934',
  LOG_CHANNEL_ID: '1373310138395525210', // Canal de logs
  
  // Configurações personalizáveis
  WELCOME_MESSAGE: '👋 Olá! Bem-vindo ao servidor.\n\nAntes de liberar seu acesso, responda:\n**Quem você conhece no servidor?**',
  VERIFICATION_TIMEOUT: 2 * 60 * 1000, // 2 minutos
  PREFIX: '!'
};