import type { BranchId } from "@/lib/branches";

/**
 * Photos and guest reviews shown on the home page. Photos are taken from the
 * branch's Justdial listing; swap in the owner's originals when they arrive.
 * Reviews are shortened excerpts, otherwise worded as on Justdial.
 */

export interface BranchPhoto {
  src: string;
  alt: string;
  /** Tall photos take a taller tile in the gallery. */
  tall?: boolean;
}

export const BRANCH_PHOTOS: Record<BranchId, BranchPhoto[]> = {
  sangli: [
    { src: "/images/sangli/room-marble.jpg", alt: "Massage room with steam shower and marble walls", tall: true },
    { src: "/images/sangli/steam-shower.jpg", alt: "Steam shower cabin in a massage room", tall: true },
    { src: "/images/sangli/room-gold-marble.jpg", alt: "Massage bed with towel swans and rose petals", tall: true },
    { src: "/images/sangli/room-wood-bed.jpg", alt: "Massage room with a wooden bed and steam shower", tall: true },
    { src: "/images/sangli/room-blue.jpg", alt: "Massage room in blue mood lighting", tall: true },
  ],
  karad: [
    { src: "/images/karad/exterior.jpg", alt: "The Karad branch at Malkapur Phata" },
    { src: "/images/karad/buddha-nook.jpg", alt: "Buddha nook with warm lighting at the Karad branch", tall: true },
    { src: "/images/karad/salon.jpg", alt: "Salon stations and product shelves" },
    { src: "/images/karad/steam-shower.jpg", alt: "Steam shower cabin with blue lighting", tall: true },
    { src: "/images/karad/lounge.jpg", alt: "Waiting lounge" },
    { src: "/images/karad/towel-swans.jpg", alt: "Towel swans with roses on a massage bed", tall: true },
    { src: "/images/karad/towel-fan.jpg", alt: "Folded towel and rose petals on a massage bed" },
  ],
};

export interface GuestReview {
  name: string;
  branch: BranchId;
  /** As shown on Justdial, e.g. "06 May 2025". */
  date: string;
  text: string;
}

export const GUEST_REVIEWS: GuestReview[] = [
  {
    name: "Hajare",
    branch: "sangli",
    date: "08 Oct 2026",
    text: "The staff was incredibly polite and attentive, making me feel welcomed from the moment I arrived. The serene ambiance added to the overall experience, leaving me rejuvenated and satisfied.",
  },
  {
    name: "Mr Ganesh Namdev Kadam",
    branch: "sangli",
    date: "30 Sep 2026",
    text: "The relaxing ambience instantly put me at ease. From haircuts to body treatments, the skilled staff provided top-notch care. It's the perfect blend of quality and affordability!",
  },
  {
    name: "Mr Sachin Yadav",
    branch: "sangli",
    date: "07 Oct 2026",
    text: "The prices are very reasonable, making it easy to enjoy their services without breaking the bank. Everything looked well-maintained and hygienic. The staff was friendly and professional.",
  },
  {
    name: "Sumit Oswal",
    branch: "karad",
    date: "06 May 2025",
    text: "The ambiance is soothing, and the staff is incredibly professional. I opted for their signature facial and a massage, both of which yielded excellent results. My skin feels rejuvenated, and the stress just melted away.",
  },
  {
    name: "Manthan",
    branch: "karad",
    date: "03 May 2025",
    text: "The place feels very luxurious and special. The lights are soft, and the music is calming. You can relax and forget your worries. I loved my treatment — I felt pampered and happy.",
  },
  {
    name: "Shruti Kadam",
    branch: "karad",
    date: "28 Jun 2025",
    text: "The salon is extremely clean, and all the equipment looks brand new. They pay great attention to hygiene, which made me feel very safe during my visit.",
  },
  {
    name: "Yashodhan Vadar",
    branch: "karad",
    date: "29 Sep 2026",
    text: "The knowledgeable staff truly made a difference; they were attentive and provided personalized recommendations tailored to my needs. The ambiance was soothing, adding to the overall relaxation.",
  },
  {
    name: "Ajit Mane",
    branch: "karad",
    date: "13 Apr 2025",
    text: "The staff is very experienced and made me feel comfortable. The equipment was clean, which I really liked. I got a facial and scrub done, and it was wonderful!",
  },
  {
    name: "Sagar Patil",
    branch: "karad",
    date: "28 Jun 2025",
    text: "The results are excellent every time I visit. My hair looks great, and my skin feels so soft after a spa treatment. The staff is friendly and always helpful.",
  },
];
