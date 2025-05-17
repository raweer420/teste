module.exports = {
  name: 'stop',
  description: 'Para a reprodução de música',
  category: 'Music',
  
  async execute(message, args, client) {
    const musicManager = client.musicManager;
    
    if (!musicManager) {
      return message.reply('❌ Sistema de música não está funcionando corretamente.');
    }
    
    musicManager.stop(message);
  }
};