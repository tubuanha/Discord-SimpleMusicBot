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

import type { exportableYouTube } from "..";
import type { LoggerObject } from "../../../logger";
import type { StreamInfo } from "../../audiosource";

import { getLogger } from "../../../logger";

/**
 * 戦略ごとに保持されるキャッシュを示します。
 * @template T キャッシュが生成された戦略の識別子
 * @template U 各戦略に固有のキャッシュの構造
 */
export type Cache<T extends string, U> = {
  type: T,
  data: U,
};

/**
 * 戦略を示します
 * @template T キャッシュの種類を指定します
 * @template U 各戦略に固有のキャッシュの構造
 */
export abstract class Strategy<T extends Cache<any, U>, U> {
  abstract get cacheType(): string;
  protected logger: LoggerObject;

  constructor(protected priority: number){
    this.logger = getLogger(this.constructor.name);
  }

  abstract getInfo(url: string): Promise<{
    data: exportableYouTube,
    cache: T,
  }>;

  abstract fetch(url: string, forceCache?: boolean, cache?: Cache<any, any>): Promise<{
    stream: StreamInfo,
    info: exportableYouTube,
    relatedVideos: exportableYouTube[],
    cache: T,
  }>;

  /** 戦略が使用されたことを示すログを出力します */
  protected logStrategyUsed(){
    this.logger.info("using strategy #" + this.priority);
  }

  protected abstract mapToExportable(url: string, info: U): exportableYouTube;
}
