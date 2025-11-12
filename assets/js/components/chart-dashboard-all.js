document.addEventListener("DOMContentLoaded", function () {
  const categories = ["Building", "Infrastruktur 1", "Infrastruktur 2", "EPC"];
  const sudah = [43, 16, 18, 11];
  const belum = [5, 4, 6, 0];
  const total = sudah.map((v, i) => v + belum[i]);

  // Hitung posisi maksimal untuk y-axis
  const maxTotal = Math.max(...total);
  const yMax = maxTotal > 0 ? maxTotal + Math.ceil(maxTotal * 0.2) : 1;

  // Annotations untuk angka total di atas bar
  const totalLabels = categories
    .map((cat, i) => {
      if (total[i] <= 0) return null;
      return {
        x: cat,
        y: total[i],
        label: {
          offsetY: -10,
          style: {
            color: "#000",
            background: "#fff",
            fontSize: "13px",
            fontWeight: "bold",
          },
          text: total[i].toString(),
        },
      };
    })
    .filter(Boolean);

  var optionsPegawai = {
    chart: {
      type: "bar",
      height: 350,
      stacked: true,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        columnWidth: "55%",
        borderRadius: 4,
      },
    },
    series: [
      { name: "Sudah Sertifikat", data: sudah },
      { name: "Belum Sertifikat", data: belum },
    ],
    xaxis: {
      categories: categories,
    },
    yaxis: {
      min: 0,
      max: yMax,
    },
    colors: ["#3674B5", "#FF8282"],
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val; // angka dalam bar
      },
      style: { fontSize: "12px", fontWeight: "bold", colors: ["#fff"] },
    },
    legend: { position: "top" },
    annotations: {
      points: totalLabels,
    },
  };

  var chartPegawai = new ApexCharts(document.querySelector("#chart-pm-bersertifikat"), optionsPegawai);
  chartPegawai.render();
});
