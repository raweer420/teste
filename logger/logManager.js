// Substitua em logger/logManager.js
const { EmbedBuilder } = require('discord.js');
const { LOG_CHANNEL_ID } = require('../config');

/**
 * Sistema central de logs para o bot
 */
class LogManager {
  /**
   * Envia um log para o canal designado
   * @param {Client} client Cliente do Discord
   * @param {Object} options Opções do log
   * @param {String} options.title Título do log
   * @param {Array} options.fields Campos do embed
   * @param {String} options.color Cor do embed (default: Blue)
   * @param {String} options.thumbnail URL da thumbnail (opcional)
   * @param {String} options.description Descrição do log (opcional)
   * @param {String} options.image URL da imagem (opcional)
   * @param {String} options.footer Texto do rodapé (opcional)
   */
  static async sendLog(client, options) {
    try {
      // Adicionar debugs para verificar fluxo
      console.log(`Tentando enviar log: ${options.title}`);
      console.log(`Canal de log ID: ${LOG_CHANNEL_ID}`);
      
      if (!LOG_CHANNEL_ID) {
        return console.error('❌ LOG_CHANNEL_ID não configurado no config.js');
      }
      
      const logChannel = await client.channels.fetch(LOG_CHANNEL_ID).catch(err => {
        console.error(`❌ Erro ao buscar canal de logs (${LOG_CHANNEL_ID}):`, err);
        return null;
      });
      
      if (!logChannel) {
        return console.error('❌ Canal de logs não encontrado! Verifique o ID no config.js');
      }
      
      console.log(`Canal de log encontrado: ${logChannel.name}`);

      const embed = new EmbedBuilder()
        .setTitle(options.title || 'Log')
        .setColor(options.color || 'Blue')
        .setTimestamp();

      if (options.description) embed.setDescription(options.description);
      if (options.thumbnail) embed.setThumbnail(options.thumbnail);
      if (options.image) embed.setImage(options.image);
      if (options.footer) embed.setFooter({ text: options.footer });
      if (options.fields && options.fields.length > 0) embed.addFields(options.fields);

      await logChannel.send({ embeds: [embed] }).catch(err => {
        console.error('❌ Erro ao enviar mensagem de log:', err);
      });
      
      console.log('✅ Log enviado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao enviar log:', error);
    }
  }

  /**
   * Trunca texto muito longo para evitar erros nos embeds
   * @param {String} text Texto a ser truncado
   * @param {Number} maxLength Tamanho máximo (default: 1024)
   * @returns {String} Texto truncado
   */
  static truncate(text, maxLength = 1024) {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength - 3)}...` : text;
  }

  /**
   * Formata uma data em timestamp do Discord
   * @param {Date|Number} date Data ou timestamp
   * @returns {String} Timestamp formatado
   */
  static formatTimestamp(date) {
    const timestamp = date instanceof Date ? Math.floor(date.getTime() / 1000) : Math.floor(date / 1000);
    return `<t:${timestamp}:F> (<t:${timestamp}:R>)`;
  }
}

module.exports = LogManager;