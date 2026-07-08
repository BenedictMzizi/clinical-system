import { globalSelect }
from "../../lib/globalDataLayer";



/*========================================
GET PRICE
========================================*/

export async function getServicePrice(

    practiceId,

    serviceCode

){

    const result =
        await globalSelect(

            "service_pricing",

            query =>

                query

                .select("*")

                .eq(
                    "practice_id",
                    practiceId
                )

                .eq(
                    "service_code",
                    serviceCode
                )

                .eq(
                    "active",
                    true
                )

                .single()

        );

    if(!result)

        throw new Error(

            `Price not configured for ${serviceCode}`

        );

    return Number(result.price);

          }
export async function getAllPrices(

    practiceId

){

    return await globalSelect(

        "service_pricing",

        query =>

            query

            .select("*")

            .eq(
                "practice_id",
                practiceId
            )

            .eq(
                "active",
                true
            )

            .order(
                "service_name"
            )

    );

                  }
export async function updatePrice(

    priceId,

    newPrice

){

    return await globalUpdate(

        "service_pricing",

        { id: priceId },

        {

            price:newPrice,

            updated_at:
                new Date().toISOString()

        }

    );

                  }
