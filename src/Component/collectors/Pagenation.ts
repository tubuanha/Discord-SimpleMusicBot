/*
 * Copyright 2021-2023 mtripg6666tdr
 * 
 * This file is part of mtripg6666tdr/Discord-SimpleMusicBot. 
 * (npm package name: 'discord-music-bot' / repository url: <https://github.com/mtripg6666tdr/Discord-SimpleMusicBot> )
 * 
 * mtripg6666tdr/Discord-SimpleMusicBot is free software: you can redistribute it and/or modify it 
 * under the terms of the GNU General Public License as published by the Free Software Foundation, 
 * either version 3 of the License, or (at your option) any later version.
 *
 * mtripg6666tdr/Discord-SimpleMusicBot is distributed in the hope that it will be useful, 
 * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with mtripg6666tdr/Discord-SimpleMusicBot. 
 * If not, see <https://www.gnu.org/licenses/>.
 */

import type { InteractionCollectorEvents } from "./InteractionCollector";
import type { CommandMessage } from "../commandResolver/CommandMessage";
import type { AnyGuildTextChannel, ComponentInteraction, ComponentTypes, EmbedOptions } from "oceanic.js";

import { MessageEmbedBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";
import { MessageActionRowBuilder, MessageButtonBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";

import { InteractionCollector } from "./InteractionCollector";

const arrowRightEmoji = "▶";
const arrowLeftEmoji = "◀";

/**
 * 最終的にメッセージの埋め込みに解決されるデータ
 */
type MessageEmbedsResolvable =
  | EmbedOptions[]
  | MessageEmbedBuilder[]
  | ((pagenum: number) => EmbedOptions)
  | ((pagenum: number) => Promise<EmbedOptions>);

interface PagenationEvents extends InteractionCollectorEvents {
  arrowLeft: [interaction: ComponentInteraction<ComponentTypes.BUTTON, AnyGuildTextChannel>];
  arrowRight: [interaction: ComponentInteraction<ComponentTypes.BUTTON, AnyGuildTextChannel>];
}

export class Pagenation extends InteractionCollector<PagenationEvents> {
  protected _embedsResolvable: MessageEmbedsResolvable = null;
  protected _embeds: EmbedOptions[] = null;
  protected _arrowLeftCustomId: string = null;
  protected _arrowRightCustomId: string = null;
  protected _currentPage: number;
  protected _totalPage: number;

  setPages(embeds: MessageEmbedsResolvable, total: number){
    this._embedsResolvable = embeds;
    this._totalPage = total;
    this._embeds = Array.from({ length: total });
    return this;
  }

  async send(message: CommandMessage, initialPage: number = 0){
    if(!this._embeds || !this._embedsResolvable){
      throw new Error("server or embeds not set");
    }
    const { customIdMap } = this
      .setMaxInteraction(Infinity)
      .setResetTimeoutOnInteraction(true)
      .setTimeout(5 * 60 * 1000)
      .createCustomIds({
        arrowLeft: "button" as unknown as never,
        arrowRight: "button" as unknown as never,
      });
    this._arrowLeftCustomId = customIdMap.arrowLeft;
    this._arrowRightCustomId = customIdMap.arrowRight;
    this._currentPage = initialPage;
    this.setMessage(
      await message.reply({
        content: "",
        embeds: [
          await this.resolvePageEmbed(this._currentPage),
        ],
        components: [
          this.createMessageComponents(this._currentPage),
        ],
      })
    );
    this.on("arrowLeft", interaction => this.edit(--this._currentPage, interaction));
    this.on("arrowRight", interaction => this.edit(++this._currentPage, interaction));
    return this;
  }

  protected async edit(page: number, interaction?: ComponentInteraction<ComponentTypes.BUTTON, AnyGuildTextChannel>){
    this._currentPage = page;
    const messageContent = {
      content: "",
      embeds: [
        await this.resolvePageEmbed(page),
      ],
      components: [
        this.createMessageComponents(page),
      ],
    };
    if(interaction){
      this.setMessage(await interaction.editOriginal(messageContent));
    }else{
      await this.message.edit(messageContent);
    }
  }

  protected async resolvePageEmbed(page: number){
    if(page < 0 || page >= this._totalPage){
      return null;
    }else if(this._embeds[page]){
      return this._embeds[page];
    }else if(Array.isArray(this._embedsResolvable)){
      const embed = this._embedsResolvable[page];
      if(embed instanceof MessageEmbedBuilder){
        return this._embeds[page] = embed.toOceanic();
      }else{
        return this._embeds[page] = embed;
      }
    }else{
      return this._embeds[page] = await this._embedsResolvable(page);
    }
  }

  protected createMessageComponents(page: number){
    return (
      new MessageActionRowBuilder()
        .addComponents(
          new MessageButtonBuilder()
            .setCustomId(this._arrowLeftCustomId)
            .setDisabled(page === 0)
            .setEmoji(arrowLeftEmoji)
            .setStyle("PRIMARY"),
          new MessageButtonBuilder()
            .setCustomId(this._arrowRightCustomId)
            .setDisabled(page + 1 === this._totalPage)
            .setEmoji(arrowRightEmoji)
            .setStyle("PRIMARY")
        )
        .toOceanic()
    );
  }
}
