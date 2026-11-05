// First visits follow the peace campaign; connections remain bidirectional.
export const JOURNEY_ORDER=Object.freeze(['water','fire','lightning','wind','earth','wood','ice','light','dark']);
export const SEA_ROUTES=Object.freeze([['earth','wood'],['earth','ice'],['wood','ice'],['wood','light'],['ice','light']].map(Object.freeze));
export const travelKind=(from,to)=>SEA_ROUTES.some(pair=>pair.includes(from)&&pair.includes(to))?'dock':'gate';
export const ATLAS_LAYOUT={
  nameless:{x:51,y:12,polygon:'35,13 37,8 40,8 42,6 45,7 47,5 50,6 53,4 57,6 59,9 63,10 66,9 69,13 67,16 63,18 61,20 55,19 51,22 46,20 41,18 36,16',links:['water','fire','lightning']},
  water:{x:28,y:24,polygon:'35,13 36,16 41,18 38,24 40,29 39,34 35,36 31,36 29,33 25,32 23,34 20,33 18,29 15,27 16,23 18,20 20,17 26,15 29,13 32,14',links:['nameless','fire','wind']},
  fire:{x:51,y:26,polygon:'41,18 46,20 51,22 55,19 61,20 63,24 62,28 60,30 59,34 54,36 49,36 46,34 41,33 39,34 40,29 38,24',links:['nameless','water','lightning','wind']},
  lightning:{x:73,y:25,polygon:'61,20 63,18 67,16 69,13 72,14 76,14 79,18 82,19 84,22 86,23 87,28 86,30 83,31 81,34 77,33 73,36 69,37 65,35 62,36 59,34 60,30 62,28 63,24',links:['nameless','fire','wind']},
  wind:{x:51,y:42,polygon:'23,34 25,32 29,33 31,36 35,36 39,34 41,33 46,34 49,36 54,36 59,34 62,36 65,35 69,37 73,36 77,33 81,34 78,38 74,40 72,44 69,46 67,49 62,50 58,52 53,51 50,52 46,51 42,52 38,49 34,48 32,45 30,43 30,40 27,37',links:['water','fire','lightning','earth']},
  earth:{x:51,y:58,polygon:'34,48 38,49 42,52 46,51 50,52 53,51 58,52 62,50 67,49 68,52 67,54 69,56 67,60 64,64 60,66 57,69 53,70 50,68 47,69 44,67 41,66 39,63 36,62 34,58 35,55 34,52',links:['wind','wood','ice']},
  wood:{x:83,y:70,polygon:'77,62 81,61 84,63 87,63 90,66 94,67 96,71 94,74 95,77 92,80 87,81 84,84 81,85 79,82 75,81 73,78 71,76 72,72 70,70 73,67 74,64',links:['earth','ice','light']},
  ice:{x:17,y:70,polygon:'7,65 12,63 15,61 18,62 20,65 23,67 27,68 29,72 27,75 28,78 25,80 23,83 19,85 16,83 14,80 10,78 8,75 5,74 4,70 6,68',links:['earth','wood','light']},
  light:{x:50,y:78,polygon:'37,76 40,73 44,72 47,70 50,71 53,70 56,73 60,74 62,77 64,80 62,83 59,84 56,83 53,85 50,84 47,85 44,83 41,84 38,82 35,80',links:['wood','ice','dark']},
  dark:{x:50,y:89,polygon:'35,80 38,82 41,84 44,83 47,85 50,84 53,85 56,83 59,84 62,83 64,85 63,89 61,92 58,93 56,96 52,97 49,99 46,97 44,94 40,93 38,90 37,86',links:['light']}
};
