
"use client"
import { getHomePage } from "@/api/api";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { HiAnime } from "aniwatch";
import axios from "axios";
import Link from "next/link";  
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";








export default function Home() {

  const [data,setHomeData]=useState<HiAnime.ScrapedHomePage>()
  let [activeSpot,setSpot]=useState(0)








  

  

  useEffect(() => {
    async function fetchData() {
      const home_data = await getHomePage();
      setHomeData(home_data);
    }

    fetchData();

   


  }, []); 
  // console.log(data)
  const trending=data?.trendingAnimes
  const spotlight=data?.spotlightAnimes
  const topAiring=data?.topAiringAnimes
  // const mostFavourites=data?.mostFavoriteAnimes
  // const mostPopular=data?.mostPopularAnimes
  // console.log(spotlight)

  useEffect(() => {
    const timer = setInterval(() => {
      if (data?.spotlightAnimes) {
        setSpot((prev) => (prev < data.spotlightAnimes.length - 1 ? prev + 1 : 0));
      }
    }, 3000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, [data?.spotlightAnimes]);





  return (

    <div className="main flex flex-col items-center  max-h-screen gap-y-5 ">

      <div className="spotlight  pt-44 md:pt-96  mt-10 relative w-full  h-[100px] md:h-[500px]  overflow-hidden">
          {spotlight?.[activeSpot]?.poster && (
            <>
            <Link href={`/anime/${spotlight[activeSpot].id}`}>
              <div className="absolute inset-0">
                {/*eslint-disable-next-line @next/next/no-img-element */}


                
              <img 
                  src={spotlight[activeSpot].poster} 
                  className="w-full h-full object-cover"
                  alt={spotlight[activeSpot].name}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              </div>
              </Link>
              
              <div className="absolute bottom-1 md:bottom-10 left-5 md:left-10 text-white z-10">
              <h1 className="text-s md:text-xl font-bold md:mb-2 ">{`#${activeSpot+1} Spotlight`}</h1> 
                <h2 className="text-xl md:text-4xl font-bold md:mb-2 ">{spotlight[activeSpot].name}</h2>
                <div className="flex gap-2 mb-4">
                  {spotlight.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSpot(index)}
                      className={`w-2 h-2   md:w-3 md:h-3 rounded-full transition-all ${
                        index === activeSpot ? 'bg-white scale-110' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="absolute bottom-10 right-10 flex gap-4 z-10 invisible md:visible">
                <button
                  onClick={() => setSpot((prev) => (prev > 0 ? prev - 1 : spotlight.length - 1))}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-md hover:bg-white/20 transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setSpot((prev) => (prev < spotlight.length - 1 ? prev + 1 : 0))}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-md hover:bg-white/20 transition"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
                


        <div className="trending flex flex-col  justify-center items-center max-h-1/4 max-w-screen">
        
          <div className="w-full px-1 md:px-12">
              <h1 className="text-l md:text-3xl font-bold md:mb-4 text-left">Trending</h1>
          </div>
          
          
          <div className="container flex overflow-x-scroll max-h-[100%]  md:max-w-11/12 no-scrollbar snap-x ">
              {
                trending?.map((item,index)=>{
                  return(
                    <div className="item flex flex-col max-h-[90%] min-w-1/3 p-1  md:p-3  md:min-w-1/6 " key={index}>

                      <img src={item.poster} className="object-contain snap-start" />
                      <h4 className="text-xs truncate md:text-ellipsis md:text-wrap md:text-base md:visible">{item?.name}</h4>

                    </div>
                  )
                })
              }
          </div>

        </div>

        <div className="top-airing flex flex-col  justify-center items-center max-h-1/4 max-w-screen">
        
          <div className="w-full px-1 md:px-12">
              <h1 className="text-l md:text-3xl font-bold md:mb-4 text-left">Top Airing</h1>
          </div>
          
          
          <div className="container flex overflow-x-scroll max-h-[100%]  md:max-w-11/12 no-scrollbar snap-x ">
              {
                topAiring?.map((item,index)=>{
                  return(
                    <div className="item flex flex-col max-h-[90%] min-w-1/3 p-1  md:p-3  md:min-w-1/6 " key={index}>

                      <img src={item.poster} className="object-contain snap-start" />
                      <h4 className="text-xs truncate md:text-ellipsis md:text-wrap md:text-base md:visible">{item?.name}</h4>

                    </div>
                  )
                })
              }
          </div>

        </div>

  
    </div>

    






  );
}
