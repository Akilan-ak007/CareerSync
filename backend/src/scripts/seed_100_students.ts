import { PrismaClient, PlacementStatus } from '@prisma/client';

const prisma = new PrismaClient();

const rawData = `RCAS2024BCY046	INBAVARUNAN S	Cyber Security	Male	Hostel	9120.0%	8950.0%	8240.0%	 	https://github.com/inba-web	https://drive.google.com/file/d/1CvljA9jVEZBUpF7dC4IQX-I6rn3CjM2m/view?usp=drive_link	https://www.linkedin.com/in/inbavarunan-s	2027-05-31	https://inbavarunan-portfolio.vercel.app	inbavarunans@gmail.com	inbavarunans.bcy24@rathinam.in	9876543210	https://drive.google.com/file/d/1fmkUGuUsnWnFfZ_lppA7jv9YFWjNuV7Y/view?usp=sharing	PLACED
RCAS2024BCY002	Sneha D	Cyber Security	Female	Hostel	8010.0%	9130.0%	8450.0%	 	https://github.com/sneha-bcy	https://drive.google.com/file/d/1Resume_RCAS2024BCY002_Doc/view?usp=drive_link	https://www.linkedin.com/in/sneha-d	2027-05-31	https://sneha.portfolio.dev	sneha.d85@gmail.com	snehad.bcy24@rathinam.in	9876565302	https://drive.google.com/file/d/1Photo_RCAS2024BCY002/view?usp=sharing	PLACED
RCAS2024BBA003	Mythili B	Business Administration	Female	Hostel	8370.0%	9410.0%	8950.0%	 	https://github.com/mythili-bba	https://drive.google.com/file/d/1Resume_RCAS2024BBA003_Doc/view?usp=drive_link	https://www.linkedin.com/in/mythili-b	2027-05-31	https://mythili.portfolio.dev	mythili.b30@gmail.com	mythilib.bba24@rathinam.in	9876565392	https://drive.google.com/file/d/1Photo_RCAS2024BBA003/view?usp=sharing	PLACED
RTC2024BCY004	Naveen V	Cyber Security	Male	Day Scholar	9300.0%	8680.0%	9440.0%	 	https://github.com/naveen-bcy	https://drive.google.com/file/d/1Resume_RTC2024BCY004_Doc/view?usp=drive_link	https://www.linkedin.com/in/naveen-v	2027-05-31	https://naveen.portfolio.dev	naveen.v58@gmail.com	naveenv.bcy24@rathinam.in	9876520328	https://drive.google.com/file/d/1Photo_RTC2024BCY004/view?usp=sharing	PLACED
RTC2024BIT005	Gautham S	Information Technology	Male	Day Scholar	9550.0%	9410.0%	8070.0%	 	https://github.com/gautham-bit	https://drive.google.com/file/d/1Resume_RTC2024BIT005_Doc/view?usp=drive_link	https://www.linkedin.com/in/gautham-s	2027-05-31	https://gautham.portfolio.dev	gautham.s68@gmail.com	gauthams.bit24@rathinam.in	9876593320	https://drive.google.com/file/d/1Photo_RTC2024BIT005/view?usp=sharing	YET_TO_BE_PLACED
RTC2024BCS006	Barath P	Computer Science	Male	Hostel	9290.0%	7860.0%	8070.0%	 	https://github.com/barath-bcs	https://drive.google.com/file/d/1Resume_RTC2024BCS006_Doc/view?usp=drive_link	https://www.linkedin.com/in/barath-p	2027-05-31	https://barath.portfolio.dev	barath.p91@gmail.com	barathp.bcs24@rathinam.in	9876583000	https://drive.google.com/file/d/1Photo_RTC2024BCS006/view?usp=sharing	PLACED
RCAS2024BCY007	Archana A	Cyber Security	Female	Day Scholar	8960.0%	9080.0%	7690.0%	 	https://github.com/archana-bcy	https://drive.google.com/file/d/1Resume_RCAS2024BCY007_Doc/view?usp=drive_link	https://www.linkedin.com/in/archana-a	2027-05-31	https://archana.portfolio.dev	archana.a73@gmail.com	archanaa.bcy24@rathinam.in	9876561856	https://drive.google.com/file/d/1Photo_RCAS2024BCY007/view?usp=sharing	YET_TO_BE_PLACED
RCAS2024BBA008	Manoj K	Business Administration	Male	Day Scholar	8680.0%	8780.0%	8030.0%	 	https://github.com/manoj-bba	https://drive.google.com/file/d/1Resume_RCAS2024BBA008_Doc/view?usp=drive_link	https://www.linkedin.com/in/manoj-k	2027-05-31	https://manoj.portfolio.dev	manoj.k27@gmail.com	manojk.bba24@rathinam.in	9876576784	https://drive.google.com/file/d/1Photo_RCAS2024BBA008/view?usp=sharing	PLACED
RCAS2024BCS009	Subhashini N	Computer Science	Female	Day Scholar	8760.0%	8050.0%	8470.0%	 	https://github.com/subhashini-bcs	https://drive.google.com/file/d/1Resume_RCAS2024BCS009_Doc/view?usp=drive_link	https://www.linkedin.com/in/subhashini-n	2027-05-31	https://subhashini.portfolio.dev	subhashini.n11@gmail.com	subhashinin.bcs24@rathinam.in	9876599166	https://drive.google.com/file/d/1Photo_RCAS2024BCS009/view?usp=sharing	YET_TO_BE_PLACED
RCAS2024BCY010	Lavanya L	Cyber Security	Female	Hostel	8730.0%	9600.0%	9210.0%	 	https://github.com/lavanya-bcy	https://drive.google.com/file/d/1Resume_RCAS2024BCY010_Doc/view?usp=drive_link	https://www.linkedin.com/in/lavanya-l	2027-05-31	https://lavanya.portfolio.dev	lavanya.l43@gmail.com	lavanyal.bcy24@rathinam.in	9876575612	https://drive.google.com/file/d/1Photo_RCAS2024BCY010/view?usp=sharing	YET_TO_BE_PLACED
RTC2024BBA011	Nandhakumar P	Business Administration	Male	Hostel	9360.0%	8690.0%	8990.0%	 	https://github.com/nandhakumar-bba	https://drive.google.com/file/d/1Resume_RTC2024BBA011_Doc/view?usp=drive_link	https://www.linkedin.com/in/nandhakumar-p	2027-05-31	https://nandhakumar.portfolio.dev	nandhakumar.p77@gmail.com	nandhakumarp.bba24@rathinam.in	9876510074	https://drive.google.com/file/d/1Photo_RTC2024BBA011/view?usp=sharing	PLACED
RTC2024BBA012	Siddharth J	Business Administration	Male	Hostel	8800.0%	7650.0%	8950.0%	 	https://github.com/siddharth-bba	https://drive.google.com/file/d/1Resume_RTC2024BBA012_Doc/view?usp=drive_link	https://www.linkedin.com/in/siddharth-j	2027-05-31	https://siddharth.portfolio.dev	siddharth.j26@gmail.com	siddharthj.bba24@rathinam.in	9876526828	https://drive.google.com/file/d/1Photo_RTC2024BBA012/view?usp=sharing	PLACED
RTC2024BIT013	Hemalatha L	Information Technology	Female	Hostel	9180.0%	8320.0%	9270.0%	 	https://github.com/hemalatha-bit	https://drive.google.com/file/d/1Resume_RTC2024BIT013_Doc/view?usp=drive_link	https://www.linkedin.com/in/hemalatha-l	2027-05-31	https://hemalatha.portfolio.dev	hemalatha.l67@gmail.com	hemalathal.bit24@rathinam.in	9876525860	https://drive.google.com/file/d/1Photo_RTC2024BIT013/view?usp=sharing	PLACED
RTC2024BCS014	Arun S	Computer Science	Male	Hostel	7940.0%	7570.0%	7960.0%	 	https://github.com/arun-bcs	https://drive.google.com/file/d/1Resume_RTC2024BCS014_Doc/view?usp=drive_link	https://www.linkedin.com/in/arun-s	2027-05-31	https://arun.portfolio.dev	arun.s75@gmail.com	aruns.bcs24@rathinam.in	9876541195	https://drive.google.com/file/d/1Photo_RTC2024BCS014/view?usp=sharing	PLACED
RTC2024BEC015	Nandhini L	Electronics and Communication	Female	Hostel	8000.0%	8450.0%	8170.0%	 	https://github.com/nandhini-bec	https://drive.google.com/file/d/1Resume_RTC2024BEC015_Doc/view?usp=drive_link	https://www.linkedin.com/in/nandhini-l	2027-05-31	https://nandhini.portfolio.dev	nandhini.l69@gmail.com	nandhinil.bec24@rathinam.in	9876517100	https://drive.google.com/file/d/1Photo_RTC2024BEC015/view?usp=sharing	PLACED
RCAS2024BIT016	Pooja K	Information Technology	Female	Hostel	8660.0%	8110.0%	7770.0%	 	https://github.com/pooja-bit	https://drive.google.com/file/d/1Resume_RCAS2024BIT016_Doc/view?usp=drive_link	https://www.linkedin.com/in/pooja-k	2027-05-31	https://pooja.portfolio.dev	pooja.k19@gmail.com	poojak.bit24@rathinam.in	9876568082	https://drive.google.com/file/d/1Photo_RCAS2024BIT016/view?usp=sharing	YET_TO_BE_PLACED
RTC2024BCS017	Jeevan G	Computer Science	Male	Day Scholar	9540.0%	7870.0%	8320.0%	 	https://github.com/jeevan-bcs	https://drive.google.com/file/d/1Resume_RTC2024BCS017_Doc/view?usp=drive_link	https://www.linkedin.com/in/jeevan-g	2027-05-31	https://jeevan.portfolio.dev	jeevan.g37@gmail.com	jeevang.bcs24@rathinam.in	9876562565	https://drive.google.com/file/d/1Photo_RTC2024BCS017/view?usp=sharing	YET_TO_BE_PLACED
RCAS2024BEC018	Hariharan P	Electronics and Communication	Male	Day Scholar	9300.0%	9220.0%	8720.0%	 	https://github.com/hariharan-bec	https://drive.google.com/file/d/1Resume_RCAS2024BEC018_Doc/view?usp=drive_link	https://www.linkedin.com/in/hariharan-p	2027-05-31	https://hariharan.portfolio.dev	hariharan.p72@gmail.com	hariharanp.bec24@rathinam.in	9876530289	https://drive.google.com/file/d/1Photo_RCAS2024BEC018/view?usp=sharing	PLACED
RCAS2024BCS019	Kavin S	Computer Science	Male	Day Scholar	9550.0%	7850.0%	9410.0%	 	https://github.com/kavin-bcs	https://drive.google.com/file/d/1Resume_RCAS2024BCS019_Doc/view?usp=drive_link	https://www.linkedin.com/in/kavin-s	2027-05-31	https://kavin.portfolio.dev	kavin.s20@gmail.com	kavins.bcs24@rathinam.in	9876534356	https://drive.google.com/file/d/1Photo_RCAS2024BCS019/view?usp=sharing	PLACED
RCAS2024BBA020	Balaji K	Business Administration	Male	Day Scholar	8660.0%	8780.0%	8400.0%	 	https://github.com/balaji-bba	https://drive.google.com/file/d/1Resume_RCAS2024BBA020_Doc/view?usp=drive_link	https://www.linkedin.com/in/balaji-k	2027-05-31	https://balaji.portfolio.dev	balaji.k43@gmail.com	balajik.bba24@rathinam.in	9876536772	https://drive.google.com/file/d/1Photo_RCAS2024BBA020/view?usp=sharing	PLACED
RTC2024BCY021	Akshaya T	Cyber Security	Female	Day Scholar	7820.0%	8870.0%	8490.0%	 	https://github.com/akshaya-bcy	https://drive.google.com/file/d/1Resume_RTC2024BCY021_Doc/view?usp=drive_link	https://www.linkedin.com/in/akshaya-t	2027-05-31	https://akshaya.portfolio.dev	akshaya.t22@gmail.com	akshayat.bcy24@rathinam.in	9876519602	https://drive.google.com/file/d/1Photo_RTC2024BCY021/view?usp=sharing	PLACED
RCAS2024BIT022	Ramya P	Information Technology	Female	Day Scholar	8420.0%	9660.0%	9060.0%	 	https://github.com/ramya-bit	https://drive.google.com/file/d/1Resume_RCAS2024BIT022_Doc/view?usp=drive_link	https://www.linkedin.com/in/ramya-p	2027-05-31	https://ramya.portfolio.dev	ramya.p77@gmail.com	ramyap.bit24@rathinam.in	9876511025	https://drive.google.com/file/d/1Photo_RCAS2024BIT022/view?usp=sharing	PLACED
RCAS2024BBA023	Naveen D	Business Administration	Male	Hostel	8230.0%	8250.0%	8780.0%	 	https://github.com/naveen-bba	https://drive.google.com/file/d/1Resume_RCAS2024BBA023_Doc/view?usp=drive_link	https://www.linkedin.com/in/naveen-d	2027-05-31	https://naveen.portfolio.dev	naveen.d43@gmail.com	naveend.bba24@rathinam.in	9876576244	https://drive.google.com/file/d/1Photo_RCAS2024BBA023/view?usp=sharing	PLACED
RTC2024BIT024	Saravanan L	Information Technology	Male	Hostel	9320.0%	8710.0%	8180.0%	 	https://github.com/saravanan-bit	https://drive.google.com/file/d/1Resume_RTC2024BIT024_Doc/view?usp=drive_link	https://www.linkedin.com/in/saravanan-l	2027-05-31	https://saravanan.portfolio.dev	saravanan.l11@gmail.com	saravananl.bit24@rathinam.in	9876524663	https://drive.google.com/file/d/1Photo_RTC2024BIT024/view?usp=sharing	PLACED
RCAS2024BCS025	Subhashini R	Computer Science	Female	Day Scholar	9430.0%	9390.0%	9270.0%	 	https://github.com/subhashini-bcs	https://drive.google.com/file/d/1Resume_RCAS2024BCS025_Doc/view?usp=drive_link	https://www.linkedin.com/in/subhashini-r	2027-05-31	https://subhashini.portfolio.dev	subhashini.r36@gmail.com	subhashinir.bcs24@rathinam.in	9876599399	https://drive.google.com/file/d/1Photo_RCAS2024BCS025/view?usp=sharing	PLACED
RTC2024BIT026	Rajeswari R	Information Technology	Female	Day Scholar	9460.0%	9440.0%	7260.0%	 	https://github.com/rajeswari-bit	https://drive.google.com/file/d/1Resume_RTC2024BIT026_Doc/view?usp=drive_link	https://www.linkedin.com/in/rajeswari-r	2027-05-31	https://rajeswari.portfolio.dev	rajeswari.r52@gmail.com	rajeswarir.bit24@rathinam.in	9876563964	https://drive.google.com/file/d/1Photo_RTC2024BIT026/view?usp=sharing	YET_TO_BE_PLACED
RCAS2024BCS027	Lavanya R	Computer Science	Female	Hostel	8760.0%	7940.0%	9310.0%	 	https://github.com/lavanya-bcs	https://drive.google.com/file/d/1Resume_RCAS2024BCS027_Doc/view?usp=drive_link	https://www.linkedin.com/in/lavanya-r	2027-05-31	https://lavanya.portfolio.dev	lavanya.r54@gmail.com	lavanyar.bcs24@rathinam.in	9876550001	https://drive.google.com/file/d/1Photo_RCAS2024BCS027/view?usp=sharing	YET_TO_BE_PLACED
RCAS2024BEC028	Barath K	Electronics and Communication	Male	Day Scholar	9780.0%	8110.0%	8680.0%	 	https://github.com/barath-bec	https://drive.google.com/file/d/1Resume_RCAS2024BEC028_Doc/view?usp=drive_link	https://www.linkedin.com/in/barath-k	2027-05-31	https://barath.portfolio.dev	barath.k61@gmail.com	barathk.bec24@rathinam.in	9876599065	https://drive.google.com/file/d/1Photo_RCAS2024BEC028/view?usp=sharing	YET_TO_BE_PLACED
RCAS2024BCY029	Meena J	Cyber Security	Female	Day Scholar	8340.0%	7740.0%	8200.0%	 	https://github.com/meena-bcy	https://drive.google.com/file/d/1Resume_RCAS2024BCY029_Doc/view?usp=drive_link	https://www.linkedin.com/in/meena-j	2027-05-31	https://meena.portfolio.dev	meena.j50@gmail.com	meenaj.bcy24@rathinam.in	9876567199	https://drive.google.com/file/d/1Photo_RCAS2024BCY029/view?usp=sharing	PLACED
RCAS2024BCS030	Pradeep A	Computer Science	Male	Day Scholar	9210.0%	9570.0%	8900.0%	 	https://github.com/pradeep-bcs	https://drive.google.com/file/d/1Resume_RCAS2024BCS030_Doc/view?usp=drive_link	https://www.linkedin.com/in/pradeep-a	2027-05-31	https://pradeep.portfolio.dev	pradeep.a35@gmail.com	pradeepa.bcs24@rathinam.in	9876557739	https://drive.google.com/file/d/1Photo_RCAS2024BCS030/view?usp=sharing	PLACED
RTC2024BCY031	Akshaya G	Cyber Security	Female	Hostel	9230.0%	8720.0%	7640.0%	 	https://github.com/akshaya-bcy	https://drive.google.com/file/d/1Resume_RTC2024BCY031_Doc/view?usp=drive_link	https://www.linkedin.com/in/akshaya-g	2027-05-31	https://akshaya.portfolio.dev	akshaya.g95@gmail.com	akshayag.bcy24@rathinam.in	9876559695	https://drive.google.com/file/d/1Photo_RTC2024BCY031/view?usp=sharing	PLACED
RCAS2024BCY032	INBAVARUNAN P	Cyber Security	Male	Day Scholar	9040.0%	8210.0%	8220.0%	 	https://github.com/inbavarunan-bcy	https://drive.google.com/file/d/1Resume_RCAS2024BCY032_Doc/view?usp=drive_link	https://www.linkedin.com/in/inbavarunan-p	2027-05-31	https://inbavarunan.portfolio.dev	inbavarunan.p96@gmail.com	inbavarunanp.bcy24@rathinam.in	9876538010	https://drive.google.com/file/d/1Photo_RCAS2024BCY032/view?usp=sharing	PLACED
RCAS2024BBA033	Bhavani G	Business Administration	Female	Day Scholar	9340.0%	8980.0%	7720.0%	 	https://github.com/bhavani-bba	https://drive.google.com/file/d/1Resume_RCAS2024BBA033_Doc/view?usp=drive_link	https://www.linkedin.com/in/bhavani-g	2027-05-31	https://bhavani.portfolio.dev	bhavani.g35@gmail.com	bhavanig.bba24@rathinam.in	9876529313	https://drive.google.com/file/d/1Photo_RCAS2024BBA033/view?usp=sharing	PLACED
RTC2024BIT034	Nandhakumar N	Information Technology	Male	Hostel	8620.0%	7820.0%	8780.0%	 	https://github.com/nandhakumar-bit	https://drive.google.com/file/d/1Resume_RTC2024BIT034_Doc/view?usp=drive_link	https://www.linkedin.com/in/nandhakumar-n	2027-05-31	https://nandhakumar.portfolio.dev	nandhakumar.n23@gmail.com	nandhakumarn.bit24@rathinam.in	9876565724	https://drive.google.com/file/d/1Photo_RTC2024BIT034/view?usp=sharing	PLACED
RTC2024BIT035	Meena T	Information Technology	Female	Day Scholar	9830.0%	8810.0%	9390.0%	 	https://github.com/meena-bit	https://drive.google.com/file/d/1Resume_RTC2024BIT035_Doc/view?usp=drive_link	https://www.linkedin.com/in/meena-t	2027-05-31	https://meena.portfolio.dev	meena.t66@gmail.com	meenat.bit24@rathinam.in	9876590301	https://drive.google.com/file/d/1Photo_RTC2024BIT035/view?usp=sharing	YET_TO_BE_PLACED
RTC2024BIT036	Manikandan T	Information Technology	Male	Day Scholar	8330.0%	8040.0%	8670.0%	 	https://github.com/manikandan-bit	https://drive.google.com/file/d/1Resume_RTC2024BIT036_Doc/view?usp=drive_link	https://www.linkedin.com/in/manikandan-t	2027-05-31	https://manikandan.portfolio.dev	manikandan.t76@gmail.com	manikandant.bit24@rathinam.in	9876573517	https://drive.google.com/file/d/1Photo_RTC2024BIT036/view?usp=sharing	PLACED
RCAS2024BBA037	Saravanan V	Business Administration	Male	Hostel	8590.0%	7840.0%	7690.0%	 	https://github.com/saravanan-bba	https://drive.google.com/file/d/1Resume_RCAS2024BBA037_Doc/view?usp=drive_link	https://www.linkedin.com/in/saravanan-v	2027-05-31	https://saravanan.portfolio.dev	saravanan.v63@gmail.com	saravananv.bba24@rathinam.in	9876563424	https://drive.google.com/file/d/1Photo_RCAS2024BBA037/view?usp=sharing	PLACED
RTC2024BCS038	Yuvan N	Computer Science	Male	Day Scholar	8580.0%	7510.0%	8010.0%	 	https://github.com/yuvan-bcs	https://drive.google.com/file/d/1Resume_RTC2024BCS038_Doc/view?usp=drive_link	https://www.linkedin.com/in/yuvan-n	2027-05-31	https://yuvan.portfolio.dev	yuvan.n59@gmail.com	yuvann.bcs24@rathinam.in	9876564921	https://drive.google.com/file/d/1Photo_RTC2024BCS038/view?usp=sharing	PLACED
RCAS2024BCS039	Raghav T	Computer Science	Male	Day Scholar	9440.0%	9090.0%	9130.0%	 	https://github.com/raghav-bcs	https://drive.google.com/file/d/1Resume_RCAS2024BCS039_Doc/view?usp=drive_link	https://www.linkedin.com/in/raghav-t	2027-05-31	https://raghav.portfolio.dev	raghav.t26@gmail.com	raghavt.bcs24@rathinam.in	9876591560	https://drive.google.com/file/d/1Photo_RCAS2024BCS039/view?usp=sharing	PLACED
RCAS2024BEC040	Raghav R	Electronics and Communication	Male	Hostel	8470.0%	8500.0%	7980.0%	 	https://github.com/raghav-bec	https://drive.google.com/file/d/1Resume_RCAS2024BEC040_Doc/view?usp=drive_link	https://www.linkedin.com/in/raghav-r	2027-05-31	https://raghav.portfolio.dev	raghav.r58@gmail.com	raghavr.bec24@rathinam.in	9876546471	https://drive.google.com/file/d/1Photo_RCAS2024BEC040/view?usp=sharing	YET_TO_BE_PLACED
RTC2024BCS041	Deepak T	Computer Science	Male	Hostel	9750.0%	7990.0%	7360.0%	 	https://github.com/deepak-bcs	https://drive.google.com/file/d/1Resume_RTC2024BCS041_Doc/view?usp=drive_link	https://www.linkedin.com/in/deepak-t	2027-05-31	https://deepak.portfolio.dev	deepak.t93@gmail.com	deepakt.bcs24@rathinam.in	9876515276	https://drive.google.com/file/d/1Photo_RTC2024BCS041/view?usp=sharing	YET_TO_BE_PLACED
RCAS2024BIT042	Adithya N	Information Technology	Male	Day Scholar	8030.0%	9590.0%	8270.0%	 	https://github.com/adithya-bit	https://drive.google.com/file/d/1Resume_RCAS2024BIT042_Doc/view?usp=drive_link	https://www.linkedin.com/in/adithya-n	2027-05-31	https://adithya.portfolio.dev	adithya.n42@gmail.com	adithyan.bit24@rathinam.in	9876558351	https://drive.google.com/file/d/1Photo_RCAS2024BIT042/view?usp=sharing	PLACED
RCAS2024BCY043	Adithya J	Cyber Security	Male	Day Scholar	8570.0%	9570.0%	7660.0%	 	https://github.com/adithya-bcy	https://drive.google.com/file/d/1Resume_RCAS2024BCY043_Doc/view?usp=drive_link	https://www.linkedin.com/in/adithya-j	2027-05-31	https://adithya.portfolio.dev	adithya.j85@gmail.com	adithyaj.bcy24@rathinam.in	9876592213	https://drive.google.com/file/d/1Photo_RCAS2024BCY043/view?usp=sharing	PLACED
RCAS2024BCS044	Madhumitha L	Computer Science	Female	Hostel	8560.0%	8610.0%	7980.0%	 	https://github.com/madhumitha-bcs	https://drive.google.com/file/d/1Resume_RCAS2024BCS044_Doc/view?usp=drive_link	https://www.linkedin.com/in/madhumitha-l	2027-05-31	https://madhumitha.portfolio.dev	madhumitha.l63@gmail.com	madhumithal.bcs24@rathinam.in	9876574251	https://drive.google.com/file/d/1Photo_RCAS2024BCS044/view?usp=sharing	PLACED
RTC2024BCY045	Logesh G	Cyber Security	Male	Day Scholar	9390.0%	8520.0%	9100.0%	 	https://github.com/logesh-bcy	https://drive.google.com/file/d/1Resume_RTC2024BCY045_Doc/view?usp=drive_link	https://www.linkedin.com/in/logesh-g	2027-05-31	https://logesh.portfolio.dev	logesh.g85@gmail.com	logeshg.bcy24@rathinam.in	9876545179	https://drive.google.com/file/d/1Photo_RTC2024BCY045/view?usp=sharing	PLACED
RCAS2024BEC046	Nandhini L	Electronics and Communication	Female	Day Scholar	8490.0%	8590.0%	7950.0%	 	https://github.com/nandhini-bec	https://drive.google.com/file/d/1Resume_RCAS2024BEC046_Doc/view?usp=drive_link	https://www.linkedin.com/in/nandhini-l	2027-05-31	https://nandhini.portfolio.dev	nandhini.l72@gmail.com	nandhinil.bec24@rathinam.in	9876537802	https://drive.google.com/file/d/1Photo_RCAS2024BEC046/view?usp=sharing	PLACED
RCAS2024BCS047	Soundarya K	Computer Science	Female	Hostel	8940.0%	8030.0%	8300.0%	 	https://github.com/soundarya-bcs	https://drive.google.com/file/d/1Resume_RCAS2024BCS047_Doc/view?usp=drive_link	https://www.linkedin.com/in/soundarya-k	2027-05-31	https://soundarya.portfolio.dev	soundarya.k72@gmail.com	soundaryak.bcs24@rathinam.in	9876568743	https://drive.google.com/file/d/1Photo_RCAS2024BCS047/view?usp=sharing	YET_TO_BE_PLACED
RTC2024BCY048	Mukesh K	Cyber Security	Male	Hostel	8930.0%	8260.0%	9490.0%	 	https://github.com/mukesh-bcy	https://drive.google.com/file/d/1Resume_RTC2024BCY048_Doc/view?usp=drive_link	https://www.linkedin.com/in/mukesh-k	2027-05-31	https://mukesh.portfolio.dev	mukesh.k80@gmail.com	mukeshk.bcy24@rathinam.in	9876553357	https://drive.google.com/file/d/1Photo_RTC2024BCY048/view?usp=sharing	PLACED
RTC2024BCS049	Karthik V	Computer Science	Male	Day Scholar	9210.0%	7920.0%	8900.0%	 	https://github.com/karthik-bcs	https://drive.google.com/file/d/1Resume_RTC2024BCS049_Doc/view?usp=drive_link	https://www.linkedin.com/in/karthik-v	2027-05-31	https://karthik.portfolio.dev	karthik.v45@gmail.com	karthikv.bcs24@rathinam.in	9876587278	https://drive.google.com/file/d/1Photo_RTC2024BCS049/view?usp=sharing	YET_TO_BE_PLACED
RCAS2024BIT050	Naveen C	Information Technology	Male	Hostel	8420.0%	9060.0%	7490.0%	 	https://github.com/naveen-bit	https://drive.google.com/file/d/1Resume_RCAS2024BIT050_Doc/view?usp=drive_link	https://www.linkedin.com/in/naveen-c	2027-05-31	https://naveen.portfolio.dev	naveen.c15@gmail.com	naveenc.bit24@rathinam.in	9876517146	https://drive.google.com/file/d/1Photo_RCAS2024BIT050/view?usp=sharing	PLACED
RCAS2024BEC051	Madhumitha P	Electronics and Communication	Female	Hostel	9780.0%	8060.0%	9180.0%	 	https://github.com/madhumitha-bec	https://drive.google.com/file/d/1Resume_RCAS2024BEC051_Doc/view?usp=drive_link	https://www.linkedin.com/in/madhumitha-p	2027-05-31	https://madhumitha.portfolio.dev	madhumitha.p24@gmail.com	madhumithap.bec24@rathinam.in	9876518564	https://drive.google.com/file/d/1Photo_RCAS2024BEC051/view?usp=sharing	PLACED
RTC2024BCS052	Balaji P	Computer Science	Male	Hostel	9370.0%	8830.0%	9020.0%	 	https://github.com/balaji-bcs	https://drive.google.com/file/d/1Resume_RTC2024BCS052_Doc/view?usp=drive_link	https://www.linkedin.com/in/balaji-p	2027-05-31	https://balaji.portfolio.dev	balaji.p38@gmail.com	balajip.bcs24@rathinam.in	9876578494	https://drive.google.com/file/d/1Photo_RTC2024BCS052/view?usp=sharing	PLACED
RTC2024BBA053	Vasanth S	Business Administration	Male	Hostel	9360.0%	8880.0%	7810.0%	 	https://github.com/vasanth-bba	https://drive.google.com/file/d/1Resume_RTC2024BBA053_Doc/view?usp=drive_link	https://www.linkedin.com/in/vasanth-s	2027-05-31	https://vasanth.portfolio.dev	vasanth.s20@gmail.com	vasanths.bba24@rathinam.in	9876530585	https://drive.google.com/file/d/1Photo_RTC2024BBA053/view?usp=sharing	PLACED
RCAS2024BCY054	Subash T	Cyber Security	Male	Hostel	8380.0%	9390.0%	7360.0%	 	https://github.com/subash-bcy	https://drive.google.com/file/d/1Resume_RCAS2024BCY054_Doc/view?usp=drive_link	https://www.linkedin.com/in/subash-t	2027-05-31	https://subash.portfolio.dev	subash.t39@gmail.com	subasht.bcy24@rathinam.in	9876544675	https://drive.google.com/file/d/1Photo_RCAS2024BCY054/view?usp=sharing	YET_TO_BE_PLACED
RCAS2024BCS055	Kavitha A	Computer Science	Female	Day Scholar	9660.0%	9320.0%	7360.0%	 	https://github.com/kavitha-bcs	https://drive.google.com/file/d/1Resume_RCAS2024BCS055_Doc/view?usp=drive_link	https://www.linkedin.com/in/kavitha-a	2027-05-31	https://kavitha.portfolio.dev	kavitha.a31@gmail.com	kavithaa.bcs24@rathinam.in	9876550319	https://drive.google.com/file/d/1Photo_RCAS2024BCS055/view?usp=sharing	PLACED
RCAS2024BBA056	Lavanya G	Business Administration	Female	Hostel	7880.0%	8450.0%	7940.0%	 	https://github.com/lavanya-bba	https://drive.google.com/file/d/1Resume_RCAS2024BBA056_Doc/view?usp=drive_link	https://www.linkedin.com/in/lavanya-g	2027-05-31	https://lavanya.portfolio.dev	lavanya.g42@gmail.com	lavanyag.bba24@rathinam.in	9876513390	https://drive.google.com/file/d/1Photo_RCAS2024BBA056/view?usp=sharing	PLACED
RCAS2024BCY057	Bhuvaneshwari B	Cyber Security	Female	Day Scholar	8160.0%	8640.0%	8220.0%	 	https://github.com/bhuvaneshwari-bcy	https://drive.google.com/file/d/1Resume_RCAS2024BCY057_Doc/view?usp=drive_link	https://www.linkedin.com/in/bhuvaneshwari-b	2027-05-31	https://bhuvaneshwari.portfolio.dev	bhuvaneshwari.b45@gmail.com	bhuvaneshwarib.bcy24@rathinam.in	9876533788	https://drive.google.com/file/d/1Photo_RCAS2024BCY057/view?usp=sharing	YET_TO_BE_PLACED
RCAS2024BCY058	Ananya T	Cyber Security	Female	Hostel	8010.0%	7850.0%	8150.0%	 	https://github.com/ananya-bcy	https://drive.google.com/file/d/1Resume_RCAS2024BCY058_Doc/view?usp=drive_link	https://www.linkedin.com/in/ananya-t	2027-05-31	https://ananya.portfolio.dev	ananya.t73@gmail.com	ananyat.bcy24@rathinam.in	9876547777	https://drive.google.com/file/d/1Photo_RCAS2024BCY058/view?usp=sharing	PLACED
RCAS2024BCY059	Kavin P	Cyber Security	Male	Day Scholar	9570.0%	9310.0%	7200.0%	 	https://github.com/kavin-bcy	https://drive.google.com/file/d/1Resume_RCAS2024BCY059_Doc/view?usp=drive_link	https://www.linkedin.com/in/kavin-p	2027-05-31	https://kavin.portfolio.dev	kavin.p79@gmail.com	kavinp.bcy24@rathinam.in	9876570552	https://drive.google.com/file/d/1Photo_RCAS2024BCY059/view?usp=sharing	PLACED
RCAS2024BIT060	Bhuvaneshwari S	Information Technology	Female	Hostel	8390.0%	9440.0%	8310.0%	 	https://github.com/bhuvaneshwari-bit	https://drive.google.com/file/d/1Resume_RCAS2024BIT060_Doc/view?usp=drive_link	https://www.linkedin.com/in/bhuvaneshwari-s	2027-05-31	https://bhuvaneshwari.portfolio.dev	bhuvaneshwari.s13@gmail.com	bhuvaneshwaris.bit24@rathinam.in	9876592578	https://drive.google.com/file/d/1Photo_RCAS2024BIT060/view?usp=sharing	PLACED
RTC2024BIT061	Ajith M	Information Technology	Male	Day Scholar	8750.0%	7760.0%	9110.0%	 	https://github.com/ajith-bit	https://drive.google.com/file/d/1Resume_RTC2024BIT061_Doc/view?usp=drive_link	https://www.linkedin.com/in/ajith-m	2027-05-31	https://ajith.portfolio.dev	ajith.m73@gmail.com	ajithm.bit24@rathinam.in	9876548254	https://drive.google.com/file/d/1Photo_RTC2024BIT061/view?usp=sharing	PLACED
RCAS2024BEC062	Manikandan R	Electronics and Communication	Male	Day Scholar	9330.0%	7800.0%	7360.0%	 	https://github.com/manikandan-bec	https://drive.google.com/file/d/1Resume_RCAS2024BEC062_Doc/view?usp=drive_link	https://www.linkedin.com/in/manikandan-r	2027-05-31	https://manikandan.portfolio.dev	manikandan.r63@gmail.com	manikandanr.bec24@rathinam.in	9876554548	https://drive.google.com/file/d/1Photo_RCAS2024BEC062/view?usp=sharing	YET_TO_BE_PLACED
RTC2024BCY063	Bhavani D	Cyber Security	Female	Day Scholar	9150.0%	9400.0%	8230.0%	 	https://github.com/bhavani-bcy	https://drive.google.com/file/d/1Resume_RTC2024BCY063_Doc/view?usp=drive_link	https://www.linkedin.com/in/bhavani-d	2027-05-31	https://bhavani.portfolio.dev	bhavani.d71@gmail.com	bhavanid.bcy24@rathinam.in	9876555236	https://drive.google.com/file/d/1Photo_RTC2024BCY063/view?usp=sharing	PLACED
RCAS2024BBA064	Karpagam K	Business Administration	Female	Day Scholar	8640.0%	8200.0%	8290.0%	 	https://github.com/karpagam-bba	https://drive.google.com/file/d/1Resume_RCAS2024BBA064_Doc/view?usp=drive_link	https://www.linkedin.com/in/karpagam-k	2027-05-31	https://karpagam.portfolio.dev	karpagam.k58@gmail.com	karpagamk.bba24@rathinam.in	9876560604	https://drive.google.com/file/d/1Photo_RCAS2024BBA064/view?usp=sharing	YET_TO_BE_PLACED
RCAS2024BCS065	Keerthana T	Computer Science	Female	Day Scholar	8480.0%	7720.0%	9140.0%	 	https://github.com/keerthana-bcs	https://drive.google.com/file/d/1Resume_RCAS2024BCS065_Doc/view?usp=drive_link	https://www.linkedin.com/in/keerthana-t	2027-05-31	https://keerthana.portfolio.dev	keerthana.t22@gmail.com	keerthanat.bcs24@rathinam.in	9876578937	https://drive.google.com/file/d/1Photo_RCAS2024BCS065/view?usp=sharing	YET_TO_BE_PLACED
RCAS2024BCS066	Jeevan R	Computer Science	Male	Day Scholar	8490.0%	9020.0%	8690.0%	 	https://github.com/jeevan-bcs	https://drive.google.com/file/d/1Resume_RCAS2024BCS066_Doc/view?usp=drive_link	https://www.linkedin.com/in/jeevan-r	2027-05-31	https://jeevan.portfolio.dev	jeevan.r52@gmail.com	jeevanr.bcs24@rathinam.in	9876598389	https://drive.google.com/file/d/1Photo_RCAS2024BCS066/view?usp=sharing	YET_TO_BE_PLACED
RTC2024BEC067	Pradeep J	Electronics and Communication	Male	Hostel	7940.0%	8890.0%	9320.0%	 	https://github.com/pradeep-bec	https://drive.google.com/file/d/1Resume_RTC2024BEC067_Doc/view?usp=drive_link	https://www.linkedin.com/in/pradeep-j	2027-05-31	https://pradeep.portfolio.dev	pradeep.j39@gmail.com	pradeepj.bec24@rathinam.in	9876521846	https://drive.google.com/file/d/1Photo_RTC2024BEC067/view?usp=sharing	PLACED
RCAS2024BCS068	Mukesh P	Computer Science	Male	Day Scholar	8400.0%	8320.0%	7530.0%	 	https://github.com/mukesh-bcs	https://drive.google.com/file/d/1Resume_RCAS2024BCS068_Doc/view?usp=drive_link	https://www.linkedin.com/in/mukesh-p	2027-05-31	https://mukesh.portfolio.dev	mukesh.p77@gmail.com	mukeshp.bcs24@rathinam.in	9876564008	https://drive.google.com/file/d/1Photo_RCAS2024BCS068/view?usp=sharing	PLACED
RCAS2024BBA069	Nandhini T	Business Administration	Female	Day Scholar	8320.0%	8060.0%	7220.0%	 	https://github.com/nandhini-bba	https://drive.google.com/file/d/1Resume_RCAS2024BBA069_Doc/view?usp=drive_link	https://www.linkedin.com/in/nandhini-t	2027-05-31	https://nandhini.portfolio.dev	nandhini.t69@gmail.com	nandhinit.bba24@rathinam.in	9876547700	https://drive.google.com/file/d/1Photo_RCAS2024BBA069/view?usp=sharing	PLACED
RCAS2024BCY070	Raghav D	Cyber Security	Male	Hostel	9850.0%	9380.0%	7450.0%	 	https://github.com/raghav-bcy	https://drive.google.com/file/d/1Resume_RCAS2024BCY070_Doc/view?usp=drive_link	https://www.linkedin.com/in/raghav-d	2027-05-31	https://raghav.portfolio.dev	raghav.d58@gmail.com	raghavd.bcy24@rathinam.in	9876584963	https://drive.google.com/file/d/1Photo_RCAS2024BCY070/view?usp=sharing	PLACED
RCAS2024BCY071	Vithya A	Cyber Security	Female	Day Scholar	9400.0%	9640.0%	9290.0%	 	https://github.com/vithya-bcy	https://drive.google.com/file/d/1Resume_RCAS2024BCY071_Doc/view?usp=drive_link	https://www.linkedin.com/in/vithya-a	2027-05-31	https://vithya.portfolio.dev	vithya.a73@gmail.com	vithyaa.bcy24@rathinam.in	9876547512	https://drive.google.com/file/d/1Photo_RCAS2024BCY071/view?usp=sharing	YET_TO_BE_PLACED
RTC2024BIT072	Janani B	Information Technology	Female	Day Scholar	9280.0%	8950.0%	9130.0%	 	https://github.com/janani-bit	https://drive.google.com/file/d/1Resume_RTC2024BIT072_Doc/view?usp=drive_link	https://www.linkedin.com/in/janani-b	2027-05-31	https://janani.portfolio.dev	janani.b90@gmail.com	jananib.bit24@rathinam.in	9876522735	https://drive.google.com/file/d/1Photo_RTC2024BIT072/view?usp=sharing	YET_TO_BE_PLACED
RCAS2024BBA073	Suresh S	Business Administration	Male	Hostel	9660.0%	8220.0%	8160.0%	 	https://github.com/suresh-bba	https://drive.google.com/file/d/1Resume_RCAS2024BBA073_Doc/view?usp=drive_link	https://www.linkedin.com/in/suresh-s	2027-05-31	https://suresh.portfolio.dev	suresh.s35@gmail.com	sureshs.bba24@rathinam.in	9876527322	https://drive.google.com/file/d/1Photo_RCAS2024BBA073/view?usp=sharing	YET_TO_BE_PLACED
RTC2024BCY074	Dhanush J	Cyber Security	Male	Hostel	9490.0%	8560.0%	9050.0%	 	https://github.com/dhanush-bcy	https://drive.google.com/file/d/1Resume_RTC2024BCY074_Doc/view?usp=drive_link	https://www.linkedin.com/in/dhanush-j	2027-05-31	https://dhanush.portfolio.dev	dhanush.j53@gmail.com	dhanushj.bcy24@rathinam.in	9876525095	https://drive.google.com/file/d/1Photo_RTC2024BCY074/view?usp=sharing	PLACED
RTC2024BCS075	Nithya V	Computer Science	Female	Hostel	8900.0%	8500.0%	8750.0%	 	https://github.com/nithya-bcs	https://drive.google.com/file/d/1Resume_RTC2024BCS075_Doc/view?usp=drive_link	https://www.linkedin.com/in/nithya-v	2027-05-31	https://nandhini.portfolio.dev	nithya.v96@gmail.com	nithyav.bcs24@rathinam.in	9876544362	https://drive.google.com/file/d/1Photo_RTC2024BCS075/view?usp=sharing	PLACED
RCAS2024BBA076	Manikandan V	Business Administration	Male	Hostel	9490.0%	9500.0%	7900.0%	 	https://github.com/manikandan-bba	https://drive.google.com/file/d/1Resume_RCAS2024BBA076_Doc/view?usp=drive_link	https://www.linkedin.com/in/manikandan-v	2027-05-31	https://manikandan.portfolio.dev	manikandan.v62@gmail.com	manikandanv.bba24@rathinam.in	9876525292	https://drive.google.com/file/d/1Photo_RCAS2024BBA076/view?usp=sharing	PLACED
RCAS2024BEC077	Santhosh R	Electronics and Communication	Male	Day Scholar	9320.0%	9580.0%	8160.0%	 	https://github.com/santhosh-bec	https://drive.google.com/file/d/1Resume_RCAS2024BEC077_Doc/view?usp=drive_link	https://www.linkedin.com/in/santhosh-r	2027-05-31	https://santhosh.portfolio.dev	santhosh.r29@gmail.com	santhoshr.bec24@rathinam.in	9876564379	https://drive.google.com/file/d/1Photo_RCAS2024BEC077/view?usp=sharing	PLACED
RTC2024BEC078	Pavithra T	Electronics and Communication	Female	Day Scholar	8000.0%	9010.0%	8450.0%	 	https://github.com/pavithra-bec	https://drive.google.com/file/d/1Resume_RTC2024BEC078_Doc/view?usp=drive_link	https://www.linkedin.com/in/pavithra-t	2027-05-31	https://pavithra.portfolio.dev	pavithra.t92@gmail.com	pavithrat.bec24@rathinam.in	9876557012	https://drive.google.com/file/d/1Photo_RTC2024BEC078/view?usp=sharing	PLACED
RTC2024BBA079	Vignesh B	Business Administration	Male	Hostel	8480.0%	9680.0%	9010.0%	 	https://github.com/vignesh-bba	https://drive.google.com/file/d/1Resume_RTC2024BBA079_Doc/view?usp=drive_link	https://www.linkedin.com/in/vignesh-b	2027-05-31	https://vignesh.portfolio.dev	vignesh.b36@gmail.com	vigneshb.bba24@rathinam.in	9876518992	https://drive.google.com/file/d/1Photo_RTC2024BBA079/view?usp=sharing	YET_TO_BE_PLACED
RTC2024BIT080	Janani V	Information Technology	Female	Day Scholar	8370.0%	9660.0%	9470.0%	 	https://github.com/janani-bit	https://drive.google.com/file/d/1Resume_RTC2024BIT080_Doc/view?usp=drive_link	https://www.linkedin.com/in/janani-v	2027-05-31	https://janani.portfolio.dev	janani.v79@gmail.com	jananiv.bit24@rathinam.in	9876542853	https://drive.google.com/file/d/1Photo_RTC2024BIT080/view?usp=sharing	YET_TO_BE_PLACED
RTC2024BCY081	Swetha S	Cyber Security	Female	Hostel	8460.0%	7880.0%	7320.0%	 	https://github.com/swetha-bcy	https://drive.google.com/file/d/1Resume_RTC2024BCY081_Doc/view?usp=drive_link	https://www.linkedin.com/in/swetha-s	2027-05-31	https://swetha.portfolio.dev	swetha.s63@gmail.com	swethas.bcy24@rathinam.in	9876578955	https://drive.google.com/file/d/1Photo_RTC2024BCY081/view?usp=sharing	PLACED
RTC2024BIT082	Dharshini G	Information Technology	Female	Hostel	9410.0%	9410.0%	8400.0%	 	https://github.com/dharshini-bit	https://drive.google.com/file/d/1Resume_RTC2024BIT082_Doc/view?usp=drive_link	https://www.linkedin.com/in/dharshini-g	2027-05-31	https://dharshini.portfolio.dev	dharshini.g68@gmail.com	dharshinig.bit24@rathinam.in	9876594323	https://drive.google.com/file/d/1Photo_RTC2024BIT082/view?usp=sharing	YET_TO_BE_PLACED
RCAS2024BCS083	Vijay A	Computer Science	Male	Day Scholar	7950.0%	7680.0%	8600.0%	 	https://github.com/vijay-bcs	https://drive.google.com/file/d/1Resume_RCAS2024BCS083_Doc/view?usp=drive_link	https://www.linkedin.com/in/vijay-a	2027-05-31	https://vijay.portfolio.dev	vijay.a18@gmail.com	vijaya.bcs24@rathinam.in	9876526540	https://drive.google.com/file/d/1Photo_RCAS2024BCS083/view?usp=sharing	PLACED
RCAS2024BEC084	Dhanush N	Electronics and Communication	Male	Day Scholar	9550.0%	8930.0%	8970.0%	 	https://github.com/dhanush-bec	https://drive.google.com/file/d/1Resume_RCAS2024BEC084_Doc/view?usp=drive_link	https://www.linkedin.com/in/dhanush-n	2027-05-31	https://dhanush.portfolio.dev	dhanush.n37@gmail.com	dhanushn.bec24@rathinam.in	9876566370	https://drive.google.com/file/d/1Photo_RCAS2024BEC084/view?usp=sharing	PLACED
RCAS2024BEC085	Naveen V	Electronics and Communication	Male	Hostel	9750.0%	9010.0%	8290.0%	 	https://github.com/naveen-bec	https://drive.google.com/file/d/1Resume_RCAS2024BEC085_Doc/view?usp=drive_link	https://www.linkedin.com/in/naveen-v	2027-05-31	https://naveen.portfolio.dev	naveen.v21@gmail.com	naveenv.bec24@rathinam.in	9876521188	https://drive.google.com/file/d/1Photo_RCAS2024BEC085/view?usp=sharing	PLACED
RCAS2024BBA086	Yogalakshmi G	Business Administration	Female	Hostel	8520.0%	8960.0%	8930.0%	 	https://github.com/yogalakshmi-bba	https://drive.google.com/file/d/1Resume_RCAS2024BBA086_Doc/view?usp=drive_link	https://www.linkedin.com/in/yogalakshmi-g	2027-05-31	https://yogalakshmi.portfolio.dev	yogalakshmi.g16@gmail.com	yogalakshmig.bba24@rathinam.in	9876547700	https://drive.google.com/file/d/1Photo_RCAS2024BBA086/view?usp=sharing	PLACED
RCAS2024BCS087	Ashwin K	Computer Science	Male	Day Scholar	8040.0%	8110.0%	7720.0%	 	https://github.com/ashwin-bcs	https://drive.google.com/file/d/1Resume_RCAS2024BCS087_Doc/view?usp=drive_link	https://www.linkedin.com/in/ashwin-k	2027-05-31	https://ashwin.portfolio.dev	ashwin.k64@gmail.com	ashwink.bcs24@rathinam.in	9876583526	https://drive.google.com/file/d/1Photo_RCAS2024BCS087/view?usp=sharing	YET_TO_BE_PLACED
RTC2024BCS088	Subathra G	Computer Science	Female	Day Scholar	9220.0%	7560.0%	7830.0%	 	https://github.com/subathra-bcs	https://drive.google.com/file/d/1Resume_RTC2024BCS088_Doc/view?usp=drive_link	https://www.linkedin.com/in/subathra-g	2027-05-31	https://subathra.portfolio.dev	subathra.g49@gmail.com	subathrag.bcs24@rathinam.in	9876554541	https://drive.google.com/file/d/1Photo_RTC2024BCS088/view?usp=sharing	PLACED
RCAS2024BCS089	Kabilan B	Computer Science	Male	Day Scholar	8570.0%	8500.0%	7560.0%	 	https://github.com/kabilan-bcs	https://drive.google.com/file/d/1Resume_RCAS2024BCS089_Doc/view?usp=drive_link	https://www.linkedin.com/in/kabilan-b	2027-05-31	https://kabilan.portfolio.dev	kabilan.b49@gmail.com	kabilanb.bcs24@rathinam.in	9876552517	https://drive.google.com/file/d/1Photo_RCAS2024BCS089/view?usp=sharing	YET_TO_BE_PLACED
RTC2024BIT090	Akash R	Information Technology	Male	Hostel	7970.0%	8470.0%	8180.0%	 	https://github.com/akash-bit	https://drive.google.com/file/d/1Resume_RTC2024BIT090_Doc/view?usp=drive_link	https://www.linkedin.com/in/akash-r	2027-05-31	https://akash.portfolio.dev	akash.r87@gmail.com	akashr.bit24@rathinam.in	9876567939	https://drive.google.com/file/d/1Photo_RTC2024BIT090/view?usp=sharing	PLACED
RCAS2024BBA091	Rahul B	Business Administration	Male	Day Scholar	7890.0%	8370.0%	8580.0%	 	https://github.com/rahul-bba	https://drive.google.com/file/d/1Resume_RCAS2024BBA091_Doc/view?usp=drive_link	https://www.linkedin.com/in/rahul-b	2027-05-31	https://rahul.portfolio.dev	rahul.b10@gmail.com	rahulb.bba24@rathinam.in	9876536794	https://drive.google.com/file/d/1Photo_RCAS2024BBA091/view?usp=sharing	PLACED
RCAS2024BEC092	INBAVARUNAN T	Electronics and Communication	Male	Hostel	9240.0%	8600.0%	9120.0%	 	https://github.com/inbavarunan-bec	https://drive.google.com/file/d/1Resume_RCAS2024BEC092_Doc/view?usp=drive_link	https://www.linkedin.com/in/inbavarunan-t	2027-05-31	https://inbavarunan.portfolio.dev	inbavarunan.t55@gmail.com	inbavarunant.bec24@rathinam.in	9876519447	https://drive.google.com/file/d/1Photo_RCAS2024BEC092/view?usp=sharing	PLACED
RCAS2024BBA093	Madhumitha A	Business Administration	Female	Day Scholar	8390.0%	8390.0%	9420.0%	 	https://github.com/madhumitha-bba	https://drive.google.com/file/d/1Resume_RCAS2024BBA093_Doc/view?usp=drive_link	https://www.linkedin.com/in/madhumitha-a	2027-05-31	https://madhumitha.portfolio.dev	madhumitha.a31@gmail.com	madhumithaa.bba24@rathinam.in	9876591018	https://drive.google.com/file/d/1Photo_RCAS2024BBA093/view?usp=sharing	PLACED
RCAS2024BBA094	Nandhini A	Business Administration	Female	Hostel	9580.0%	9140.0%	7710.0%	 	https://github.com/nandhini-bba	https://drive.google.com/file/d/1Resume_RCAS2024BBA094_Doc/view?usp=drive_link	https://www.linkedin.com/in/nandhini-a	2027-05-31	https://nandhini.portfolio.dev	nandhini.a31@gmail.com	nandhinia.bba24@rathinam.in	9876520011	https://drive.google.com/file/d/1Photo_RCAS2024BBA094/view?usp=sharing	PLACED
RCAS2024BIT095	Jeevan C	Information Technology	Male	Hostel	8200.0%	8830.0%	8950.0%	 	https://github.com/jeevan-bit	https://drive.google.com/file/d/1Resume_RCAS2024BIT095_Doc/view?usp=drive_link	https://www.linkedin.com/in/jeevan-c	2027-05-31	https://jeevan.portfolio.dev	jeevan.c93@gmail.com	jeevanc.bit24@rathinam.in	9876519876	https://drive.google.com/file/d/1Photo_RCAS2024BIT095/view?usp=sharing	PLACED
RCAS2024BBA096	Balaji B	Business Administration	Male	Day Scholar	8450.0%	8470.0%	8280.0%	 	https://github.com/balaji-bba	https://drive.google.com/file/d/1Resume_RCAS2024BBA096_Doc/view?usp=drive_link	https://www.linkedin.com/in/balaji-b	2027-05-31	https://balaji.portfolio.dev	balaji.b90@gmail.com	balajib.bba24@rathinam.in	9876549691	https://drive.google.com/file/d/1Photo_RCAS2024BBA096/view?usp=sharing	YET_TO_BE_PLACED
RCAS2024BEC097	Gautham P	Electronics and Communication	Male	Hostel	9500.0%	7670.0%	9190.0%	 	https://github.com/gautham-bec	https://drive.google.com/file/d/1Resume_RCAS2024BEC097_Doc/view?usp=drive_link	https://www.linkedin.com/in/gautham-p	2027-05-31	https://gautham.portfolio.dev	gautham.p21@gmail.com	gauthamp.bec24@rathinam.in	9876590610	https://drive.google.com/file/d/1Photo_RCAS2024BEC097/view?usp=sharing	PLACED
RCAS2024BIT098	Balaji B	Information Technology	Male	Day Scholar	8110.0%	7640.0%	7440.0%	 	https://github.com/balaji-bit	https://drive.google.com/file/d/1Resume_RCAS2024BIT098_Doc/view?usp=drive_link	https://www.linkedin.com/in/balaji-b	2027-05-31	https://balaji.portfolio.dev	balaji.b53@gmail.com	balajib.bit24@rathinam.in	9876521053	https://drive.google.com/file/d/1Photo_RCAS2024BIT098/view?usp=sharing	PLACED
RCAS2024BBA099	Soundarya G	Business Administration	Female	Hostel	8380.0%	8400.0%	7980.0%	 	https://github.com/soundarya-bba	https://drive.google.com/file/d/1Resume_RCAS2024BBA099_Doc/view?usp=drive_link	https://www.linkedin.com/in/soundarya-g	2027-05-31	https://soundarya.portfolio.dev	soundarya.g86@gmail.com	soundaryag.bba24@rathinam.in	9876516863	https://drive.google.com/file/d/1Photo_RCAS2024BBA099/view?usp=sharing	YET_TO_BE_PLACED
RCAS2024BEC100	Naveen G	Electronics and Communication	Male	Day Scholar	9150.0%	9490.0%	9210.0%	 	https://github.com/naveen-bec	https://drive.google.com/file/d/1Resume_RCAS2024BEC100_Doc/view?usp=drive_link	https://www.linkedin.com/in/naveen-g	2027-05-31	https://naveen.portfolio.dev	naveen.g52@gmail.com	naveeng.bec24@rathinam.in	9876520682	https://drive.google.com/file/d/1Photo_RCAS2024BEC100/view?usp=sharing	PLACED`;

function parsePercentage(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace('%', '').trim();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  // If the percentage was given as 9120.0%, that represents 91.2%
  if (num > 100) {
    return parseFloat((num / 100).toFixed(2));
  }
  return parseFloat(num.toFixed(2));
}

function extractUsername(urlOrId: string): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  if (trimmed.includes('github.com/')) {
    return trimmed.split('github.com/')[1]?.replace(/\/$/, '') || trimmed;
  }
  if (trimmed.includes('linkedin.com/in/')) {
    return trimmed.split('linkedin.com/in/')[1]?.replace(/\/$/, '') || trimmed;
  }
  return trimmed;
}

async function main() {
  console.log('Connecting to database...');
  
  // 1. Fetch departments or map them
  const depts = await prisma.department.findMany();
  const deptMap: Record<string, string> = {};
  for (const d of depts) {
    deptMap[d.name.toLowerCase()] = d.id;
    deptMap[d.code.toLowerCase()] = d.id;
  }

  // Helper to find or create department
  async function getDeptId(deptName: string): Promise<string> {
    const key = deptName.trim().toLowerCase();
    if (deptMap[key]) return deptMap[key];

    // Fallback mappings
    if (key.includes('cyber')) {
      const d = depts.find(x => x.name.toLowerCase().includes('cyber') || x.code === 'CS');
      if (d) return d.id;
    }
    if (key.includes('business') || key.includes('bba')) {
      const d = depts.find(x => x.name.toLowerCase().includes('business') || x.code === 'BA');
      if (d) return d.id;
    }
    if (key.includes('computer')) {
      const d = depts.find(x => x.name.toLowerCase().includes('computer') || x.code === 'CSE' || x.code === 'CS_672');
      if (d) return d.id;
    }
    if (key.includes('information')) {
      const d = depts.find(x => x.name.toLowerCase().includes('information') || x.code === 'IT');
      if (d) return d.id;
    }
    if (key.includes('electronic')) {
      const d = depts.find(x => x.name.toLowerCase().includes('electronic') || x.code === 'ECE' || x.code === 'EAC');
      if (d) return d.id;
    }

    // Create department if not found
    const code = deptName.split(' ').map(w => w[0]).join('').toUpperCase();
    const newDept = await prisma.department.create({
      data: {
        name: deptName.trim(),
        code: `${code}_${Math.floor(Math.random() * 1000)}`
      }
    });
    deptMap[key] = newDept.id;
    return newDept.id;
  }

  const lines = rawData.trim().split('\n');
  console.log(`Processing ${lines.length} lines from user data...`);

  const seenRollNos = new Set<string>();
  const seenEmails = new Set<string>();
  let updatedCount = 0;
  let createdCount = 0;

  for (const line of lines) {
    const parts = line.split('\t').map(p => p.trim());
    if (parts.length < 10) continue;

    const rollNo = parts[0];
    const name = parts[1];
    const deptName = parts[2];
    const gender = parts[3];
    const studentTypeStr = parts[4];
    const sslcStr = parts[5];
    const hscStr = parts[6];
    const ugStr = parts[7];
    const pgStr = parts[8];
    const githubIdOrUrl = parts[9];
    const resumeLink = parts[10];
    const linkedinIdOrUrl = parts[11];
    const gradDateStr = parts[12];
    const portfolio = parts[13];
    const personalEmail = parts[14];
    const collegeEmail = parts[15];
    const mobileNo = parts[16];
    const studentPhoto = parts[17];
    const placementStatusStr = parts[18];

    // De-duplicate check
    if (seenRollNos.has(rollNo)) {
      console.log(`Skipping duplicate rollNo in data: ${rollNo}`);
      continue;
    }
    seenRollNos.add(rollNo);

    // Primary email
    const primaryEmail = collegeEmail || personalEmail || `${rollNo.toLowerCase()}@rathinam.in`;
    if (seenEmails.has(primaryEmail)) {
      console.log(`Skipping duplicate email in data: ${primaryEmail}`);
      continue;
    }
    seenEmails.add(primaryEmail);

    const departmentId = await getDeptId(deptName);
    const studentType = studentTypeStr.toLowerCase().includes('hostel') ? 'HOSTEL' : 'DAY_SCHOLAR';
    const sslcPercentage = parsePercentage(sslcStr);
    const hscPercentage = parsePercentage(hscStr);
    const ugPercentage = parsePercentage(ugStr);
    const pgPercentage = pgStr && pgStr.trim() !== '' ? parsePercentage(pgStr) : null;

    const githubUrl = githubIdOrUrl.startsWith('http') ? githubIdOrUrl : `https://github.com/${githubIdOrUrl}`;
    const githubId = extractUsername(githubIdOrUrl);

    const linkedinUrl = linkedinIdOrUrl.startsWith('http') ? linkedinIdOrUrl : `https://www.linkedin.com/in/${linkedinIdOrUrl}`;
    const linkedinId = extractUsername(linkedinIdOrUrl);

    const placementStatus = (placementStatusStr === 'PLACED' || placementStatusStr === 'MULTIPLE_OFFERS')
      ? PlacementStatus.PLACED
      : PlacementStatus.NOT_PLACED;

    const graduationDate = gradDateStr ? new Date(gradDateStr) : new Date('2027-05-31');

    const updateData = {
      name,
      departmentId,
      studentType,
      email: primaryEmail,
      collegeEmail: collegeEmail || null,
      personalEmail: personalEmail || null,
      phoneNumber: mobileNo || '9876543210',
      sslcPercentage,
      hscPercentage,
      ugPercentage,
      pgPercentage,
      resumeUrl: resumeLink || '',
      selfIntroUrl: '',
      linkedinUrl,
      linkedinId,
      githubUrl,
      githubId,
      portfolioUrl: portfolio || '',
      photoUrl: studentPhoto || null,
      graduationDate,
      placementStatus
    };

    const existing = await prisma.student.findUnique({
      where: { registerNumber: rollNo }
    });

    if (existing) {
      await prisma.student.update({
        where: { id: existing.id },
        data: updateData
      });
      updatedCount++;
    } else {
      await prisma.student.create({
        data: {
          registerNumber: rollNo,
          ...updateData
        }
      });
      createdCount++;
    }
  }

  console.log(`Finished updating DB: ${updatedCount} updated, ${createdCount} created.`);

  // Verify total count in DB
  const total = await prisma.student.count();
  console.log(`Total students in DB now: ${total}`);

  // Also check if any duplicate registerNumbers or emails exist in DB and clean up if necessary
  const allStudents = await prisma.student.findMany();
  const regMap = new Map<string, string[]>();
  for (const s of allStudents) {
    if (!regMap.has(s.registerNumber)) {
      regMap.set(s.registerNumber, []);
    }
    regMap.get(s.registerNumber)!.push(s.id);
  }

  let dupDeleted = 0;
  for (const [reg, ids] of regMap.entries()) {
    if (ids.length > 1) {
      console.log(`Found duplicate IDs for roll ${reg}:`, ids);
      // Keep the first, delete others
      for (let i = 1; i < ids.length; i++) {
        await prisma.student.delete({ where: { id: ids[i] } });
        dupDeleted++;
      }
    }
  }
  console.log(`Cleaned up ${dupDeleted} duplicate student records.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
