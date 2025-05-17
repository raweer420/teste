const { EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
  name: 'lyrics',
  description: 'Busca a letra da música atual ou especificada',
  aliases: ['letra', 'ly'],
  usage: '[nome da música]',
  category: 'Música',
  async execute(message, args, client) {
    const { distube } = client;
    
    // Determinar a música a buscar
    let songTitle;
    
    if (args.length > 0) {
      // Usar a música especificada nos argumentos
      songTitle = args.join(' ');
    } else {
      // Usar a música atual
      const queue = distube.getQueue(message.guildId);
      if (!queue || !queue.songs || queue.songs.length === 0) {
        return message.reply('❌ Não há música tocando atualmente! Informe uma música para buscar a letra.');
      }
      
      const currentSong = queue.songs[0];
      songTitle = currentSong.name;
      
      // Remover partes desnecessárias do título
      songTitle = songTitle
        .replace(/\(Official Video\)/i, '')
        .replace(/\(Official Audio\)/i, '')
        .replace(/\(Official Music Video\)/i, '')
        .replace(/\[Official Video\]/i, '')
        .replace(/\(Lyrics\)/i, '')
        .replace(/\(Official Lyric Video\)/i, '')
        .trim();
    }
    
    // Enviar mensagem de carregamento
    const loadingMessage = await message.channel.send(`🔍 Buscando letra para: **${songTitle}**...`);
    
    try {
      // Usar a API do Genius para buscar a letra (ou outra API de sua escolha)
      // Note: Esta é uma versão simplificada. Uma implementação real exigiria uma API key do Genius
      const searchUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(songTitle.split('-')[0])}/${encodeURIComponent(songTitle.split('-').slice(1).join('-') || songTitle)}`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (!data || !data.lyrics) {
        return loadingMessage.edit(`❌ Não foi possível encontrar a letra para: **${songTitle}**`);
      }
      
      // Dividir a letra em partes se for muito longa (limite de 4096 caracteres por embed)
      const lyrics = data.lyrics;
      const lyricsChunks = [];
      
      for (let i = 0; i < lyrics.length; i += 4000) {
        lyricsChunks.push(lyrics.substring(i, i + 4000));
      }
      
      // Criar o primeiro embed
      const embed = new EmbedBuilder()
        .setTitle(`📝 Letra: ${songTitle}`)
        .setDescription(lyricsChunks[0])
        .setColor('#36B37E')
        .setFooter({ text: lyricsChunks.length > 1 ? `Página 1/${lyricsChunks.length}` : 'Fonte: lyrics.ovh' });
      
      // Enviar o primeiro embed
      await loadingMessage.edit({ content: null, embeds: [embed] });
      
      // Enviar as partes restantes, se houver
      for (let i = 1; i < lyricsChunks.length; i++) {
        const nextEmbed = new EmbedBuilder()
          .setDescription(lyricsChunks[i])
          .setColor('#36B37E')
          .setFooter({ text: `Página ${i+1}/${lyricsChunks.length}` });
        
        await message.channel.send({ embeds: [nextEmbed] });
      }
    } catch (error) {
      console.error('Erro ao buscar letra:', error);
      loadingMessage.edit(`❌ Erro ao buscar letra: ${error.message.slice(0, 1900)}`);
    }
  }
};