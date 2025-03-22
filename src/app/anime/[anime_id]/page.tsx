"use client"
import { getAnimeDetails, getAnimeEpisodes, getAnimeEpisodeServers, getAnimeEpisodeSources } from "@/api/api";
import { HiAnime } from "aniwatch";
import { useParams } from "next/navigation";
import { useEffect,useState } from "react";
import ReactHlsPlayer from "react-hls-player";








export default function AnimeDetails() {
    const { anime_id } = useParams();
    const [anime_details, setAnimeDetails] = useState<HiAnime.ScrapedAnimeAboutInfo | null>(null);
    const [episodes,setEpisodes]=useState<HiAnime.AnimeEpisode[] | null>(null)
    const [servers,setServers]=useState<HiAnime.ScrapedEpisodeServers| null>(null)
    const [activeEpisode,setActiveEpisode]=useState(0)  
    const [activeServer,setActiveServer]=useState<number|null>()
    const [subOrdub,setCategory]=useState("sub")
    const [sources,setSources]=useState<HiAnime.ScrapedAnimeEpisodesSources | null>(null)

    useEffect(() => {
        async function fetchData(anime_id: string) {
            try {
                // Fetch basic anime details and episodes
                const [animeDetails, animeEpisodes] = await Promise.all([
                    getAnimeDetails(anime_id),
                    getAnimeEpisodes(anime_id)
                ]);
                
                setAnimeDetails(animeDetails);
                
                if (animeEpisodes?.episodes?.length) {
                    const lastEpisodeIndex = animeEpisodes.episodes.length - 1;
                    setEpisodes(animeEpisodes.episodes);
                    setActiveEpisode(lastEpisodeIndex);
                    
                    // Fetch servers for the last episode
                    const episodeId = animeEpisodes.episodes[lastEpisodeIndex].episodeId;
                    const servers = await getAnimeEpisodeServers(episodeId);
                    setServers(servers);
                    
                    if (servers?.sub?.length) {
                        const defaultServerId = servers.sub[0].serverId;
                        setActiveServer(defaultServerId);
                        
                        // Fetch sources for the default server
                        const sources = await getAnimeEpisodeSources(
                            episodeId,
                            defaultServerId,
                            subOrdub
                        );
                        console.log(sources)
                        setSources(sources);
                    }
                }
            } catch (error) {
                console.error('Error fetching anime data:', error);
                // Handle error state here
            }
        }

        if (anime_id) {
            fetchData(anime_id as string);
        }

    }, [anime_id]); 




    const data=anime_details?.anime?.info
    const seasons=anime_details?.seasons
    const relatedAnimes=anime_details?.relatedAnimes
    const recommendedAnimes=anime_details?.recommendedAnimes



    return (
        <div className="flex flex-col items-center mt-15">
            <div className="flex flex-row  w-screen">
                <div className="episodes-container flex flex-col  bg-slate-800 md:pl-2 border-2 ">
                    <div className="episodes-header "> 
                        <span className="font-medium  text-xs truncate">Episodes</span>
                        <span className="text-sm text-muted-foreground ml-6"> {episodes?.length} episodes</span>
                    </div>   
                

                    {episodes?.map((episode, index) => (
                        <div key={index} className="episode flex flex-row gap-2">
                            <span className="episode-number ">{episode?.number}</span>
                            <span className="episode-title">{episode?.title}</span>
                        </div>
                    ))}


                </div>


                <div className="video-container flex flex-col">

                    <div className="main-video">



                    </div>

                    <div className="server-section">





                    </div>




                </div>



                

            </div>


            
        </div>
    )

}