'use client'

import { getAnimeSearch } from "@/app/api/api"
import { HiAnime } from "aniwatch"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"





export default function SearchResults() {
    const {query}=useParams()
    // const [pageNum,setPageNum]=useState(1)
    // const [searchFilters, setSearchFilters] = useState<HiAnime.SearchFilters>({});
    const [searchResults, setSearchResults] = useState<HiAnime.ScrapedAnimeSearchResult | undefined>();




    useEffect(()=>{
        
        async function fetchData(){
            const search_results=await getAnimeSearch(query as string)
            console.log(search_results)
            if (search_results?.animes?.length||0>0){
                setSearchResults(search_results)
                
            }


        }

        fetchData()

    },[query])






    
    return(
        <div className="Results flex flex-col w-full  pt-14  items-center  ">
            
            <div className="w-full mt-5 px-1 md:px-12">
              <h1 className="text-l md:text-3xl font-bold md:mb-4 text-left">Search Results</h1>
            </div>

            <div className=" flex flex-wrap  pt-5 w-full overflow-y-scroll   md:max-w-11/12 no-scrollbar snap-x  ">
                {
                    searchResults?.animes?.map((item,index)=>{
                        return(
                            <div className="card flex flex-col w-1/8 p-1  mb-2" key={index}>
                                <div className="aspect-[2/3] w-full overflow-hidden rounded-lg ">
                                    <Link href={`/anime/${item.id}`}>
                                        <img 
                                            src={item.poster || ''}
                                            className="w-full h-full object-cover   transition-transform duration-200" 
                                            alt={item?.name||''}
                                        />
                                    </Link>
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



    )





}