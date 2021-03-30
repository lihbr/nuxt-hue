<template>
  <figure class="min-h-screen">
    <img
      v-if="!clicked"
      src="~/assets/img/recaptcha-light.jpg"
      alt="ReCaptcha"
      class="light-img cursor-pointer"
      @click="clicked = true"
    />
    <img
      v-if="!clicked"
      src="~/assets/img/recaptcha-dark.jpg"
      alt="ReCaptcha"
      class="dark-img cursor-pointer"
      @click="clicked = true"
    />
    <p v-if="clicked" class="text-gray-900 dark:text-gray-100">
      Yeah, that was just an image. At least if you feel stupid now you're most
      likely not a robot~
    </p>
  </figure>
</template>

<script>
export default {
  data() {
    return {
      clicked: false
    };
  }
};
</script>
