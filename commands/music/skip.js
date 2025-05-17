module.exports = {
  name: 'skip',
  description: 'Pula a música atual',
  category: 'Music',
  
  async execute(message, args, client) {
    const musicManager = client.musicManager;
    
    if (!musicManager) {
      return message.reply('❌ Sistema de música não está funcionando corretamente.');
    }
    
    musicManager.skip(message);
  }
};