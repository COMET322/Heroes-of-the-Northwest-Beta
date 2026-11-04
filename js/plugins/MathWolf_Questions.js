//=============================================================================
// MathWolf_Questions.js
// The question bank for MathWolf's math QTEs (Aljabar SMP: Easy/Medium/Hard).
// Data only - the QTE system itself lives in MathWolf_Fighter.js.
//=============================================================================

/*:
 * @target MZ
 * @plugindesc MathWolf Question Bank - Aljabar SMP (Easy / Medium / Hard)
 * @author MathWolf Dev
 *
 * @help
 * ============================================================================
 * MATHWOLF - QUESTION BANK
 * ============================================================================
 * Just enable this plugin. MathWolf_Fighter.js (and the Mage plugin) pull
 * their questions from here. Questions are shuffled into a "deck" and drawn
 * one by one, so nothing repeats until the whole tier has been used. The
 * answer choices are also shuffled each time, so players can't memorize
 * "the answer is always C".
 *
 * ----------------------------------------------------------------------------
 * HOW TO ADD YOUR OWN QUESTION
 * Copy any line below and edit it. Each question looks like this:
 *
 *   { q: "Question text", c: ["choice 1", "choice 2", "choice 3", "choice 4"], a: 2 },
 *
 *   q = the question (use \n inside the quotes for a line break)
 *   c = exactly 4 answer choices
 *   a = position of the CORRECT choice in c, counting from 0
 *       (0 = first, 1 = second, 2 = third, 3 = fourth)
 *
 * You can type math with normal keyboard characters - they are converted
 * to nice symbols when shown in the game:
 *
 *   x^2  ->  x squared      x^3, x^4 ...  likewise
 *   x_1  ->  x with subscript 1
 *   <=   ->  less-than-or-equal      >=  ->  greater-than-or-equal
 *   *    ->  multiplication sign     " - " (spaced) and -5 -> proper minus
 *
 * ALWAYS double check the answer index (a) - a wrong answer key in a math
 * game punishes the player for being right!
 * ============================================================================
 */

(() => {
  "use strict";

  window.MathWolf = window.MathWolf || {};

  MathWolf.questionBank = {
    //=====================================================================
    // EASY  (used for parry / barrier by default)
    //=====================================================================
    easy: [
      { q: "Koefisien dari variabel x pada bentuk aljabar x^2 - 8x + 12 adalah ...",
        c: ["2", "8", "-8", "12"], a: 2 },
      { q: "Pada bentuk aljabar 3x + 5y - 7, yang merupakan konstanta adalah ...",
        c: ["3", "5", "x dan y", "-7"], a: 3 },
      { q: "Jika x = 4 dan y = -2, maka nilai dari bentuk aljabar 2x^2 - 3y adalah ...",
        c: ["26", "38", "22", "10"], a: 1 },
      { q: "Jika 5(x - 2) = 15, maka nilai x adalah ...",
        c: ["-1", "3", "5", "7"], a: 2 },
      { q: "Manakah dari bentuk berikut yang merupakan Persamaan Linear Satu Variabel (PLSV)?",
        c: ["4p - 7 = 1", "x^2 - 4 = 0", "2x + 3y = 6", "2a + b > 5"], a: 0 },
      { q: "Bentuk sederhana dari 3x + 5y - 2x + 3y adalah ...",
        c: ["x + 8y", "5x + 8y", "x + 2y", "5x + 2y"], a: 0 },
      { q: "Bentuk 2(3a - 4b) + 5b jika disederhanakan menjadi ...",
        c: ["6a - 3b", "6a - 5b", "6a + 3b", "6a - 13b"], a: 0 },
      { q: "Hasil dari perkalian (-3a^2b)(4ab^3) adalah ...",
        c: ["-12a^3b^4", "12a^3b^4", "-12a^2b^3", "-7a^3b^4"], a: 0 },
      { q: "Faktorisasi dari bentuk selisih dua kuadrat x^2 - 9 adalah ...",
        c: ["(x - 3)(x - 3)", "(x + 3)(x - 3)", "(x + 9)(x - 1)", "(x - 9)(x + 1)"], a: 1 },
      { q: "Koefisien dari suku x^2 pada bentuk aljabar 3x^3 - 5x^2 + 2x - 8 adalah ...",
        c: ["3", "5", "-5", "2"], a: 2 },
    ],

    //=====================================================================
    // MEDIUM  (used for the Fighter's attack by default)
    //=====================================================================
    medium: [
      { q: "Sederhanakan perkalian pecahan berikut!\n((x - 2) / 3) * (9 / (2x - 4))",
        c: ["3/2", "2/3", "3(x - 2)/2", "3"], a: 0 },
      { q: "Jika x_1 dan x_2 adalah akar-akar persamaan kuadrat x^2 - 6x + 8 = 0, maka nilai x_1 + x_2 dan x_1 * x_2 berturut-turut adalah ...",
        c: ["6 dan 8", "-6 dan 8", "8 dan 6", "-8 dan -6"], a: 0 },
      { q: "Bentuk pemfaktoran dari 12x^2 - 17xy - 40y^2 adalah ...",
        c: ["(4x - 5y)(3x + 8y)", "(4x + 5y)(3x - 8y)", "(6x - 5y)(2x + 8y)", "(6x + 5y)(2x - 8y)"], a: 1 },
      { q: "Hasil dari (-18x^4y^3 * 2x^2y) / (6x^3y^2) adalah ...",
        c: ["-6x^2y^2", "6x^3y^2", "-6x^3y^2", "-6x^2y"], a: 2 },
      // NOTE: the PDF printed "(x^2 + 2y)" here, which gives 10 - not one of
      // the options. "(x^2 - 2y)" gives 14, matching the PDF's answer key.
      { q: "Diketahui x adalah penyelesaian dari 2x - 5 = 7, dan y = -3. Nilai dari bentuk aljabar (x^2 - 2y) / (x + y) adalah ...",
        c: ["7", "14", "21", "42"], a: 1 },
      { q: "Bentuk paling sederhana dari pecahan aljabar (x^2 - 5x + 6) / (x^2 - 9) adalah ...",
        c: ["(x - 2) / (x + 3)", "(x - 3) / (x + 3)", "(x - 2) / (x - 3)", "(x + 2) / (x + 3)"], a: 0 },
      { q: "Himpunan penyelesaian dari pertidaksamaan 2(3x - 1) <= 4x + 6 untuk x bilangan bulat adalah ...",
        c: ["x <= 4", "x >= 4", "x <= 2", "x >= 2"], a: 0 },
      // NOTE: the PDF's answer key said "x > 2" but solving gives x < 2.
      { q: "Penyelesaian pertidaksamaan linear (1/2)(x + 4) > 2x - 1 adalah ...",
        c: ["x < 2", "x > 2", "x < 3", "x > -2"], a: 0 },
      { q: "Penyelesaian dari pertidaksamaan 3x - 2 < 10 untuk x bilangan bulat positif adalah ...",
        c: ["{1, 2, 3}", "{1, 2, 3, 4}", "{0, 1, 2, 3}", "{2, 3, 4}"], a: 0 },
      { q: "Himpunan penyelesaian dari 2x - 3 >= 7 adalah ...",
        c: ["x >= 2", "x >= 5", "x <= 5", "x >= 10"], a: 1 },
    ],

    //=====================================================================
    // HARD  (word problems - used for the Mage's attack by default)
    //=====================================================================
    hard: [
      { q: "Sebuah bus membawa 45 penumpang dewasa dan anak-anak. Tarif tiket dewasa Rp15.000,00 dan anak-anak Rp8.000,00. Jika total pendapatan tiket Rp535.000,00, berapa jumlah penumpang dewasa?",
        c: ["20 orang", "30 orang", "15 orang", "25 orang"], a: 3 },
      { q: "Mobil P berangkat dari A dengan kecepatan (x + 10) km/jam, dan mobil Q dari B menuju A dengan kecepatan (2x - 5) km/jam. Mereka bertemu dalam 2 jam. Jika jarak A-B adalah 190 km, berapa kecepatan mobil P?",
        c: ["40 km/jam", "45 km/jam", "50 km/jam", "55 km/jam"], a: 0 },
      // NOTE: the PDF said Pipa B is "3 jam" slower, which has no solution
      // among the options. "2 jam" gives x = 4, matching the PDF's answer key.
      { q: "Suatu kolam renang diisi air melalui dua pipa. Pipa A sendiri dapat mengisi penuh dalam x jam, sedangkan Pipa B membutuhkan waktu 2 jam lebih lama dari Pipa A. Jika kedua pipa dibuka bersamaan, dalam 1 jam terisi 5/12 bagian kolam. Waktu yang dibutuhkan Pipa A untuk mengisi penuh kolam sendiri adalah ...",
        c: ["2 jam", "3 jam", "4 jam", "5 jam"], a: 2 },
      { q: "Amir dan Budi mengumpulkan uang bersama. Uang Amir Rp15.000,00 lebih banyak dari uang Budi. Jika dua kali uang Budi ditambah uang Amir adalah Rp105.000,00, berapa uang Amir?",
        c: ["Rp30.000,00", "Rp45.000,00", "Rp55.000,00", "Rp60.000,00"], a: 1 },
      { q: "Umur Ayah saat ini adalah 4 kali umur Budi. Enam tahun yang lalu, jumlah umur mereka berdua adalah 48 tahun. Berapakah umur Budi saat ini?",
        c: ["14 tahun", "16 tahun", "10 tahun", "12 tahun"], a: 3 },
      { q: "Rina membeli 3 kg apel dan 2 kg jeruk. Ia membayar dengan 2 lembar uang seratus ribuan dan menerima kembalian sebesar Rp85.000,00. Di toko yang sama, Dewi membeli 1 kg apel dan 3 kg jeruk dengan total harga Rp85.000,00. Jika Ibu membeli 2 kg apel dan 2 kg jeruk serta mendapat diskon Rp10.000,00, berapakah total uang yang harus dibayarkan Ibu?",
        c: ["Rp70.000,00", "Rp80.000,00", "Rp90.000,00", "Rp100.000,00"], a: 1 },
      // NOTE: the PDF's answer key said 13 km, but the numbers give 12 km.
      { q: "Suatu taksi memberlakukan tarif awal sebesar Rp6.000,00. Tarif untuk 1 km pertama adalah Rp8.000,00, dan untuk setiap kilometer berikutnya adalah Rp4.000,00. Jika Amir menggunakan taksi tersebut dan membayar total Rp58.000,00, berapakah jarak total yang ditempuh Amir?",
        c: ["14 km", "13 km", "12 km", "11 km"], a: 2 },
      { q: "Sebuah wadah memuat x kelereng. Doni mengambil 1/4 bagian dari total kelereng. Setelah itu, Eko mengambil 1/3 bagian dari sisa kelereng yang ada di dalam wadah. Jika sisa kelereng terakhir di dalam wadah adalah 30 butir, berapakah banyak kelereng yang diterima Eko?",
        c: ["60 butir", "45 butir", "20 butir", "15 butir"], a: 3 },
      { q: "Jumlah dua buah bilangan adalah 45. Jika bilangan pertama dikurangi 3, nilainya menjadi dua kali bilangan kedua. Berapakah hasil kali kedua bilangan tersebut?",
        c: ["434", "464", "450", "310"], a: 0 },
      { q: "Budi membeli 3 buku tulis dan 2 pensil dengan total harga Rp16.500,00. Jika harga satu buku tulis dinyatakan dengan x dan harga satu pensil dinyatakan dengan y, maka model matematika yang tepat adalah ...",
        c: ["3x + 2y = 16.500", "2x + 3y = 16.500", "3x - 2y = 16.500", "5(x + y) = 16.500"], a: 0 },
      { q: "Sebuah kebun berbentuk persegi panjang mempunyai ukuran panjang (3x - 2) meter dan lebar (x + 5) meter. Luas kebun tersebut dalam variabel x adalah ...",
        c: ["(3x^2 + 13x - 10) m^2", "(3x^2 - 13x - 10) m^2", "(3x^2 + 17x - 10) m^2", "(3x^2 + 13x + 10) m^2"], a: 0 },
      // NOTE: the PDF said the perimeter is 36 cm, which gives x = 6.67.
      // 38 cm gives x = 7, matching the PDF's answer key.
      { q: "Suatu segitiga memiliki panjang sisi-sisinya (x + 2) cm, (2x - 1) cm, dan (3x - 5) cm. Jika keliling segitiga tersebut adalah 38 cm, nilai x adalah ...",
        c: ["5", "6", "7", "8"], a: 2 },
      { q: "Tiga bilangan bulat berurutan jika dijumlahkan menghasilkan nilai 108. Berapakah selisih (beda) antara bilangan terbesar dan bilangan terkecil?",
        c: ["2", "3", "4", "6"], a: 0 },
      { q: "Jumlah dua bilangan cacah adalah 35, sedangkan selisih kedua bilangan adalah 9. Berapakah hasil kali kedua bilangan tersebut?",
        c: ["286", "276", "296", "306"], a: 0 },
      { q: "Sebuah bak mandi dapat diisi penuh oleh pipa A saja dalam waktu 6 jam dan oleh pipa B saja dalam waktu 3 jam. Berapa jam waktu yang dibutuhkan jika kedua pipa dibuka bersama-sama?",
        c: ["1,5 jam", "2 jam", "2,5 jam", "3 jam"], a: 1 },
    ],
  };
})();
