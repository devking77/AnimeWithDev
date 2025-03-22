import { HiAnime } from "aniwatch"
import axios from "axios"
import { Params } from "next/dist/server/request/params"

const BASE_URL=process.env.NEXT_PUBLIC_BACKEND_URL









export async function getHomePage() {
    const {data}= await axios.get(`${BASE_URL}/home`)
    return data?.data
}

export async function getAnimeDetails(anime_id:Params["anime_id"]) {
    const {data}= await axios.get(`${BASE_URL}/anime/${anime_id}`)
    return data?.data
}

export async function getAnimeEpisodes(anime_id:Params["anime_id"]) {
    const {data}= await axios.get(`${BASE_URL}/anime/${anime_id}/episodes`)
    // console.log(data?.data)
    return data?.data
}

export async function getAnimeEpisodeServers(episode_id:HiAnime.AnimeEpisode["episodeId"]) {
    const {data}= await axios.get(`${BASE_URL}/episode/servers?animeEpisodeId=${episode_id}`)
    return data?.data
}

export async function getAnimeEpisodeSources(episode_id:HiAnime.AnimeEpisode["episodeId"],server_id:string,category:string) {
    const {data}= await axios.get(`${BASE_URL}/episode/sources?animeEpisodeId=${episode_id}?server=${server_id}&category=${category}
`)
    return data?.data
}