// commands/music/queue.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Mostra a fila de músicas atual'),
  
  async execute(interaction) {
    try {
      // Usar o novo musicManager em vez do distube
      const musicManager = interaction.client.musicManager;
      
      if (!musicManager) {
        return await interaction.reply('❌ Sistema de música não está funcionando corretamente.');
      }
      
      const guildId = interaction.guild.id;
      const queue = musicManager.getQueue(guildId);
      
      if (!queue || (!queue.playing && queue.songs.length === 0)) {
        return await interaction.reply('❌ Não há músicas na fila!');
      }
      
      // Criar embed para a fila
      const embed = new EmbedBuilder()
        .setTitle('🎵 Fila de Músicas')
        .setColor('#3498db');
      
      // Música atual
      const currentSong = musicManager.getNowPlaying(guildId);
      if (currentSong) {
        embed.addFields({
          name: '🎧 Tocando agora',
          value: `**${currentSong.title}** - \`${musicManager.formatDuration(currentSong.duration)}\` - Pedido por: ${currentSong.requestedBy}`
        });
      }
      
      // Próximas músicas (até 10)
      if (queue.songs.length > 0) {
        const queueList = queue.songs
          .slice(0, 10)
          .map((song, index) => `${index + 1}. **${song.title}** - \`${musicManager.formatDuration(song.duration)}\` - Pedido por: ${song.requestedBy}`)
          .join('\n');
        
        embed.addFields({
          name: '📋 Próximas músicas',
          value: queueList
        });
        
        // Se houver mais músicas além das 10 mostradas
        if (queue.songs.length > 10) {
          embed.addFields({
            name: '📢 E mais...',
            value: `Mais ${queue.songs.length - 10} músicas na fila`
          });
        }
      } else if (!currentSong) {
        embed.setDescription('Não há músicas na fila');
      }
      
      // Informações adicionais
      embed.addFields({
        name: '🔄 Loop',
        value: queue.loop ? 'Ativado' : 'Desativado',
        inline: true
      });
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Erro ao executar comando queue:', error);
      await interaction.reply(`❌ Ocorreu um erro: ${error.message || 'Erro desconhecido'}`);
    }
  }
};