const playdl = require('play-dl');
const { debugPlayDl } = require('../../preload');

module.exports = {
  name: 'play',
  description: 'Toca uma música do YouTube',
  aliases: ['p'],
  category: 'Music',
  usage: '<url ou nome da música>',
  cooldown: 3,
  
  async execute(message, args, client) {
    // Verificar se há argumentos
    if (!args.length) {
      return message.reply('❌ Você precisa fornecer uma URL ou nome de música!');
    }
    
    // Verificar se o usuário está em um canal de voz
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply('❌ Você precisa estar em um canal de voz para usar este comando!');
    }
    
    // Verificar permissões
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return message.reply('❌ Preciso de permissões para entrar e falar no canal de voz!');
    }
    
    // Obter a query dos argumentos
    const query = args.join(' ');
    
    try {
      // Log de diagnóstico
      console.log('Query recebida:', query);
      
      // Tentar validar e encontrar URL
      let videoUrl = query;
      
      // Se não for uma URL válida, fazer busca
      if (!playdl.yt_validate(query)) {
        console.log('Realizando busca no YouTube');
        const searchResults = await playdl.search(query, { limit: 1 });
        
        if (searchResults.length === 0) {
          return message.reply('❌ Nenhuma música encontrada.');
        }
        
        videoUrl = searchResults[0].url;
        console.log('URL encontrada:', videoUrl);
      }
      
      // Diagnóstico adicional
      await debugPlayDl(videoUrl);
      
      // Usar o musicManager do cliente
      const musicManager = client.musicManager;
      
      if (!musicManager) {
        return message.reply('❌ Sistema de música não está funcionando corretamente.');
      }
      
      // Responder com mensagem de carregamento
      const loadingMsg = await message.reply('🔍 Buscando música...');
      
      // Criar um objeto de interação para compatibilidade 
      const interaction = {
        guild: message.guild,
        channel: message.channel,
        member: message.member,
        user: message.author,
        followUp: async (content) => {
          if (typeof content === 'string') {
            await loadingMsg.edit(content);
          } else {
            await loadingMsg.edit({ content: null, ...content });
          }
        },
        reply: async (content) => {
          await loadingMsg.edit(content);
        }
      };
      
      // Adicionar música à fila
      await musicManager.addSong(interaction, videoUrl);
      
    } catch (error) {
      console.error('Erro detalhado no comando play:', error);
      message.reply(`❌ Ocorreu um erro: ${error.message || 'Erro desconhecido'}`);
    }
  }
};