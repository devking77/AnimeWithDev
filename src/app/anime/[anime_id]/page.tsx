"use client"
import { getAnimeDetails, getAnimeEpisodes, getAnimeEpisodeServers, getAnimeEpisodeSources } from "@/api/api";
import { HiAnime } from "aniwatch";
import { useParams } from "next/navigation";
import { useEffect,useState,useRef } from "react";
// import ReactHlsPlayer from "react-hls-player";


import Hls from 'hls.js'; 
// import { Url } from "next/dist/shared/lib/router/router";
// import { URL } from "url";






export default function AnimeDetails() {
    const { anime_id } = useParams();
    const [anime_details, setAnimeDetails] = useState<HiAnime.ScrapedAnimeAboutInfo | null>(null);
    const [episodes,setEpisodes]=useState<HiAnime.AnimeEpisode[] | null>(null)
    const [servers,setServers]=useState<HiAnime.ScrapedEpisodeServers| null>(null)
    const [activeEpisode,setActiveEpisode]=useState(0)  
    const [activeServer,setActiveServer]=useState<number|null>()
    const [subOrdub,setCategory]=useState("sub")
    const [sources,setSources]=useState<HiAnime.ScrapedAnimeEpisodesSources | null>(null)
    const [videoError, setVideoError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);


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
                    const lastEpisodeIndex = 0//animeEpisodes.episodes.length - 1;
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
                            defaultServerId?.toString() || '',
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
    // const seasons=anime_details?.seasons
    // const relatedAnimes=anime_details?.relatedAnimes
    const recommendedAnimes=anime_details?.recommendedAnimes

    

    useEffect(() => {
        if (!sources?.sources[0]?.url || !videoRef.current) return;
        const videoUrl = sources?.sources[0]?.url;
        console.log(videoUrl)
        const video = videoRef.current;

        if (Hls.isSupported()) {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }

            const hls = new Hls();
            hlsRef.current = hls;

            hls.loadSource(videoUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    setVideoError('Error loading video');
                    console.error('HLS error:', data);
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // For Safari which has native HLS support
            video.src = videoUrl;
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [sources]);





    useEffect(() => {

        async function fetchData(){
        const episodeId = episodes?.[activeEpisode]?.episodeId;
        const servers = await getAnimeEpisodeServers(episodeId as  string);
        setServers(servers);
        
        if (servers?.sub?.length) {
            const defaultServerId = servers.sub[0].serverId;
            setActiveServer(defaultServerId);
            
            // Fetch sources for the default server
            const sources = await getAnimeEpisodeSources(
                episodeId as string,
                defaultServerId?.toString() || '',
                subOrdub
            );
            console.log(sources)
            setSources(sources);

        }
        }
        fetchData()

        


    },[activeEpisode,activeServer,subOrdub])




    return (
        <div className="flex flex-col items-center mt-8 md:mt-15 h-full w-screen">
            <div className="flex flex-col-reverse md:flex-row  w-screen max-h-10/12 mt-10  ">
               
            <div className="episodes-container flex flex-col border-1 overflow-scroll w-full min-w-1/6 mt-1 md:mt-0 md:ml-9 max-h-[calc(100vh-400px)] md:max-h-[700px]">
                    <div className="episodes-header h-[30px] mb-2"> 
                        <span className="font-medium pl-2 text-xs truncate">Episodes</span>
                        <span className="text-sm text-muted-foreground ml-6">{episodes?.length} episodes</span>
                    </div>   
                
                    <div className="episodes-list flex-1 overflow-y-auto">
                        {episodes?.map((episode, index) => (
                        <div key={index} className={`episode flex flex-row items-center w-full p-1 cursor-pointer  hover:bg-gray-500 ${index==activeEpisode ?'bg-gray-500':index%2===0 ?'bg-gray-900':''} ` } onClick={()=>setActiveEpisode(index)}>
                            <span className="episode-number min-w-[24px] text-center">{episode?.number}</span>
                            <span className="episode-title truncate text-xs ml-3">{episode?.title}</span>
                        </div>
                        ))}

                    </div>

                </div>


                <div className="video-container flex flex-col min-w-3/5  md:pl-2">

                    <div className="main-video">
                    {videoError ? (
                            <div className="error-message flex items-center justify-center text-white w-full h-full">
                                {videoError}
                            </div>
                        ) : (
                            <video
                                ref={videoRef}
                                className="w-full  object-contain"
                                controls
                                autoPlay={false}
                            />
                        )}
                    </div>

                    <div className="server-section flex flex-col md:flex-row">
                        <div className="flex md:w-1/3  items-center justify-center p-1 md:p-5 bg-emerald-950 md:rounded-xl">
                            <span className="text-xs md:text-base line-clamp-5">{"If current server doesn't work please try other servers beside."}</span>
                        </div>
                        
                        <div className="server-list flex flex-col bg-rose-950 md:bg-transparent justify-center p-5 gap-2 rounded-b-xl md:rounded-none">
                            <div className="subs flex flex-row items-center">
                                <div>
                                    <span className="font-bold">Sub:</span>
                                </div>


                                <div className="flex flex-row ml-2 ">

                                    {servers?.sub?.map((server,index)=>{
                                        return(
                                            <div key={index} className="flex server p-1 cursor-pointer items-center bg-gray-800  rounded-lg  mx-1 hover:bg-gray-700 transition-colors"
                                            onClick={()=>{setActiveServer(server?.serverId);setCategory("sub")}}
                                            
                                            >
                                                <span className="server-name ">{server?.serverName}</span>
                                            </div>
                                        )
                                    })
                                }

                                </div>
                    
                            </div>

                            <div className={`dubs ${servers?.dub?.length||0 >= 1 ? "visible" : "invisible"} flex flex-row items-center `}>

                                <div>
                                    <span className="font-bold">Dub:</span>
                                </div>

                                <div className="flex flex-row ml-2 ">

                                    {servers?.dub?.map((server,index)=>{
                                        return(
                                            <div key={index} className="flex server p-1 cursor-pointer items-center bg-gray-800 rounded-lg mx-1 hover:bg-gray-700 transition-colors"
                                            onClick={()=>{setActiveServer(server?.serverId);setCategory("dub")}}
                                                >
                                                <span className="server-name ">{server?.serverName}</span>
                                            </div>
                                        )
                                    })
                                }

                                </div>


                            </div>



                        </div>



                    </div>

                </div>


                <div className="details-section hidden md:flex flex-col pl-10 max-w-2/10 w-full gap-4">
                    <div className="flex flex-col items-start gap-3">
                        <img 
                            src={data?.poster || undefined}
                            className=" max-h-[200px] object-contain " 
                            alt={data?.name||""}
                        />
                        <div className="title w-full">
                            <h1 className="text-xl font-bold line-clamp-2">{data?.name}</h1>
                        </div>
                    </div>

                    <div className="description pr-5">
                        <p className="text-sm text-muted-foreground line-clamp-6 leading-relaxed">
                            {data?.description}
                        </p>
                    </div>
                </div>


            </div>


            
            <div className="flex flex-col mt-5">

                
                <div className="recommended flex flex-col  justify-center items-center max-h-1/4 max-w-screen">
                    
                    <div className="w-full px-1 md:px-12">
                        <h1 className="text-l md:text-3xl font-bold md:mb-4 text-left">Recommended Animes</h1>
                    </div>
                    
                    
                    <div className="container flex overflow-x-scroll max-h-[100%]  md:max-w-11/12 no-scrollbar snap-x ">
                        {
                        recommendedAnimes?.map((item,index)=>{
                            return(
                            <div className="item flex flex-col max-h-[90%] min-w-1/3 p-1 md:p-3 md:min-w-1/8 snap-start" key={index}>
                                <div className="aspect-[2/3] w-full overflow-hidden rounded-lg">
                                <img 
                                    src={item.poster||undefined} 
                                    className="w-full h-full object-cover  hover:scale-105 transition-transform duration-200" 
                                    alt={item?.name||''}
                                />
                                </div>
                                <h4 className="text-xs truncate md:text-ellipsis line-clamp-2 md:text-wrap md:text-base md:visible pt-2">
                                    {item?.name}
                                </h4>
                            </div>
                            )
                        })
                        }
                    </div>

                </div>
                






            </div>


            


            
        </div>
    )

}