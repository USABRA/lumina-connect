import { notFound } from "next/navigation";

import LandingPageView from "@/components/landing/LandingPageView";
import LandingUnavailable from "@/components/landing/LandingUnavailable";
import { getProductPublic, ProductUnavailableError } from "@/lib/api";

export default async function ProductLandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ event?: string; lang?: string }>;
}) {
  const { code } = await params;
  const query = await searchParams;

  let product;
  try {
    product = await getProductPublic(code);
  } catch (err) {
    if (err instanceof ProductUnavailableError) {
      return <LandingUnavailable code={code} />;
    }
    notFound();
  }

  return (
    <LandingPageView
      product={product}
      code={code}
      urlEvent={typeof query.event === "string" ? query.event : null}
      urlLang={typeof query.lang === "string" ? query.lang : null}
    />
  );
}
